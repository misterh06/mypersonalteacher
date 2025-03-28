import React, { useEffect, useRef, useState } from "react";
import * as JXG from "jsxgraph";

// Ajout du type pour les éléments JSXGraph
interface JXGElement extends JXG.GeometryElement {
  elType: string;
  X?: ((t?: number, suspendUpdate?: boolean) => number) | (() => number);
  Y?: ((t?: number, suspendUpdate?: boolean) => number) | (() => number);
  id?: string;
  parents?: string[];
  Value?: ((t?: number) => number) | (() => number);
}

export default function GeometryBoard() {
  const boardRef = useRef<JXG.Board | null>(null);
  const [board, setBoard] = useState<JXG.Board | null>(null);
  const [points, setPoints] = useState<JXGElement[]>([]);
  const [segments, setSegments] = useState<JXGElement[]>([]);
  const [angles, setAngles] = useState<JXGElement[]>([]);
  const [measurements, setMeasurements] = useState<JXGElement[]>([]);
  const [protractor, setProtractor] = useState<JXGElement | null>(null);
  const [geometryFeedback, setGeometryFeedback] = useState<string>("");
  const [currentTool, setCurrentTool] = useState<string>("move");
  const [showProtractor, setShowProtractor] = useState<boolean>(false);
  const [instructions, setInstructions] = useState<string>("");
  const [selectedPoints, setSelectedPoints] = useState<JXGElement[]>([]);
  const [isCreatingShape, setIsCreatingShape] = useState<boolean>(false);

  // Initialisation du plan avec une échelle en cm
  useEffect(() => {
    const b = JXG.JSXGraph.initBoard("jxgboard", {
      boundingbox: [-10, 10, 10, -10],
      axis: true,
      grid: true,
      showNavigation: true,
      showCopyright: false,
      unitX: 50, // 50 pixels = 1 cm
      unitY: 50  // 50 pixels = 1 cm
    } as JXG.BoardAttributes);
    boardRef.current = b;
    setBoard(b);

    return () => {
      JXG.JSXGraph.freeBoard(b);
    };
  }, []);

  // Fonction pour effacer un point et ses éléments associés
  const eraseElement = (e: MouseEvent) => {
    if (!board) return;
    
    const coords = board.getUsrCoordsOfMouse(e);
    const x = coords[0];
    const y = coords[1];
    
    // Trouver le point le plus proche du clic
    const elements = board.objectsList as JXGElement[];
    let closestPoint: JXGElement | null = null;
    let minDistance = 0.5; // Distance minimale pour la sélection

    for (const element of elements) {
      if (element.elType === 'point' && element.X && element.Y) {
        const distance = Math.sqrt(
          Math.pow(element.X() - x, 2) + 
          Math.pow(element.Y() - y, 2)
        );
        if (distance < minDistance) {
          closestPoint = element;
          minDistance = distance;
        }
      }
    }

    if (closestPoint && closestPoint.id) {
      // Supprimer les angles et segments associés à ce point
      const associatedElements = (board.objectsList as JXGElement[]).filter(element => {
        if (element.elType === 'angle' || element.elType === 'segment') {
          const parents = element.parents || [];
          return parents.includes(closestPoint!.id!);
        }
        return false;
      });

      // Supprimer les éléments associés
      associatedElements.forEach(element => {
        board.removeObject(element);
      });

      // Supprimer le point
      board.removeObject(closestPoint);

      // Mettre à jour les états
      const pointId = closestPoint.id;
      setPoints(prev => prev.filter(p => (p as JXGElement).id !== pointId));
      setAngles(prev => prev.filter(a => !associatedElements.some(e => e.id === (a as JXGElement).id)));
      setSegments(prev => prev.filter(s => !associatedElements.some(e => e.id === (s as JXGElement).id)));

      setInstructions("Élément effacé");
    }
  };

  // Fonction pour créer un segment avec une longueur spécifique
  const createSegmentWithLength = (point1: JXGElement, length: number) => {
    if (!board) return null;

    // Créer un cercle invisible avec le rayon souhaité
    const circle = board.create('circle', [point1, length], { visible: false });
    
    // Créer un point libre sur le cercle
    const point2 = board.create('glider', [point1.X() + length, point1.Y(), circle], {
      name: String.fromCharCode(66 + points.length), // B, C, D...
      size: 3,
      color: 'blue'
    });

    // Créer le segment
    const segment = board.create('segment', [point1, point2], {
      strokeColor: 'black',
      strokeWidth: 2
    });

    // Afficher la mesure
    const measure = board.create('text', [
      (point1.X() + point2.X()) / 2 + 0.5,
      (point1.Y() + point2.Y()) / 2 + 0.5,
      () => `${length.toFixed(1)} cm`
    ], {
      fontSize: 12
    });

    setPoints(prev => [...prev, point2]);
    setSegments(prev => [...prev, segment]);
    setMeasurements(prev => [...prev, measure]);

    return { point2, segment };
  };

  // Fonction pour créer un carré
  const createSquare = (startPoint: JXGElement, sideLength: number) => {
    if (!board) return;

    const p1 = startPoint;
    const { point2: p2, segment: s1 } = createSegmentWithLength(p1, sideLength)!;

    // Créer les autres points du carré
    const p3 = board.create('point', [
      () => p2.X() - (p2.Y() - p1.Y()),
      () => p2.Y() + (p2.X() - p1.X())
    ], { name: String.fromCharCode(66 + points.length + 1), size: 3, color: 'blue' });

    const p4 = board.create('point', [
      () => p1.X() - (p2.Y() - p1.Y()),
      () => p1.Y() + (p2.X() - p1.X())
    ], { name: String.fromCharCode(66 + points.length + 2), size: 3, color: 'blue' });

    // Créer les segments restants
    const s2 = board.create('segment', [p2, p3], { strokeColor: 'black', strokeWidth: 2 });
    const s3 = board.create('segment', [p3, p4], { strokeColor: 'black', strokeWidth: 2 });
    const s4 = board.create('segment', [p4, p1], { strokeColor: 'black', strokeWidth: 2 });

    // Créer les diagonales
    const d1 = board.create('segment', [p1, p3], { strokeColor: 'gray', strokeWidth: 1 });
    const d2 = board.create('segment', [p2, p4], { strokeColor: 'gray', strokeWidth: 1 });

    // Point d'intersection des diagonales
    const center = board.create('intersection', [d1, d2, 0], {
      name: 'O',
      size: 2,
      color: 'red'
    });

    setPoints(prev => [...prev, p2, p3, p4, center]);
    setSegments(prev => [...prev, s1, s2, s3, s4, d1, d2]);
  };

  // Fonction pour créer un triangle isocèle
  const createIsoscelesTriangle = (basePoint: JXGElement, angle: number, sideLength: number) => {
    if (!board) return;

    const p1 = basePoint;
    
    // Créer un point à la distance spécifiée
    const circle = board.create('circle', [p1, sideLength], { visible: false });
    
    // Créer le deuxième point sur le cercle
    const p2 = board.create('glider', [p1.X() + sideLength, p1.Y(), circle], {
      name: String.fromCharCode(66 + points.length),
      size: 3,
      color: 'blue'
    });

    // Créer un point pour former l'angle spécifié
    const angleRad = (angle * Math.PI) / 180;
    const p3 = board.create('point', [
      () => p1.X() + sideLength * Math.cos(angleRad),
      () => p1.Y() + sideLength * Math.sin(angleRad)
    ], {
      name: String.fromCharCode(66 + points.length + 1),
      size: 3,
      color: 'blue'
    });

    // Créer les segments
    const s1 = board.create('segment', [p1, p2], { strokeColor: 'black', strokeWidth: 2 });
    const s2 = board.create('segment', [p1, p3], { strokeColor: 'black', strokeWidth: 2 });
    const s3 = board.create('segment', [p2, p3], { strokeColor: 'black', strokeWidth: 2 });

    // Créer l'angle
    const ang = board.create('angle', [p2, p1, p3], {
      radius: 1,
      name: angle + '°',
      color: 'orange',
      fillColor: 'orange',
      fillOpacity: 0.3
    });

    setPoints(prev => [...prev, p2, p3]);
    setSegments(prev => [...prev, s1, s2, s3]);
    setAngles(prev => [...prev, ang]);
  };

  // Fonction pour créer un angle
  const createAngle = (p1: JXGElement, p2: JXGElement, p3: JXGElement) => {
    if (!board) return null;

    // Créer les segments avec des coordonnées dynamiques
    const segment1 = board.create('segment', [p2, p1], {
      strokeColor: 'orange',
      strokeWidth: 2,
      highlight: false
    }) as JXGElement;

    const segment2 = board.create('segment', [p2, p3], {
      strokeColor: 'orange',
      strokeWidth: 2,
      highlight: false
    }) as JXGElement;

    // Créer l'angle avec une étiquette dynamique
    const angle = board.create('angle', [p1, p2, p3], {
      radius: 2,
      color: 'orange',
      fillColor: 'orange',
      fillOpacity: 0.3,
      label: {
        fontSize: 16,
        strokeColor: 'black',
        cssStyle: 'font-weight: bold',
        display: 'internal',
        anchorX: 'middle',
        anchorY: 'middle',
        offset: [0, 0],
        parse: false,
        useMathJax: false
      },
      type: 'sector',
      orthoType: 'square',
      orthoSensitivity: 2
    }) as unknown as JXGElement;

    // Ajouter un texte pour afficher la mesure de l'angle
    const angleText = board.create('text', [
      () => p2.X?.() ?? 0 + 2,
      () => p2.Y?.() ?? 0,
      () => {
        const angleValue = (angle.Value?.() ?? 0) * (180 / Math.PI);
        return angleValue.toFixed(1) + '°';
      }
    ], {
      fontSize: 16,
      fixed: true,
      highlight: false
    }) as JXGElement;

    setSegments(prev => [...prev, segment1, segment2]);
    setAngles(prev => [...prev, angle]);
    setMeasurements(prev => [...prev, angleText]);

    return angle;
  };

  // Gestion des clics
  useEffect(() => {
    if (!board) return;

    const handleClick = (e: MouseEvent) => {
      console.log("Clic détecté, outil actuel:", currentTool);
      
      if (currentTool === "move") {
        // En mode déplacement, on ne fait rien car JSXGraph gère automatiquement
        // le déplacement des points quand fixed: false
        return;
      }
      
      if (currentTool === "eraser") {
        eraseElement(e);
        return;
      }

      const coords = board.getUsrCoordsOfMouse(e);
      const x = coords[0];
      const y = coords[1];

      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const pointName = points.length < alphabet.length ? alphabet[points.length] : `P${points.length + 1}`;

      if (currentTool === "point") {
        const newPoint = board.create("point", [x, y], {
          name: pointName,
          size: 3,
          color: "blue",
          fixed: false,
        }) as JXGElement;

        setPoints(prev => [...prev, newPoint]);
        setSelectedPoints([]);
        setInstructions("Point créé");
      } 
      else if (currentTool === "segment") {
        const newPoint = board.create("point", [x, y], {
          name: pointName,
          size: 3,
          color: "blue",
          fixed: false,
        }) as JXGElement;

        setPoints(prev => [...prev, newPoint]);
        
        if (selectedPoints.length === 1) {
          const segment = board.create("segment", [selectedPoints[0], newPoint], {
            strokeColor: "black",
            strokeWidth: 2
          });

          // Ajouter la mesure de longueur
          const measure = board.create('text', [
            () => (selectedPoints[0].X() + newPoint.X()) / 2 + 0.5,
            () => (selectedPoints[0].Y() + newPoint.Y()) / 2 + 0.5,
            () => {
              const dx = selectedPoints[0].X() - newPoint.X();
              const dy = selectedPoints[0].Y() - newPoint.Y();
              const length = Math.sqrt(dx * dx + dy * dy);
              return `${length.toFixed(1)} cm`;
            }
          ]);

          setSegments(prev => [...prev, segment]);
          setMeasurements(prev => [...prev, measure]);
          setSelectedPoints([]);
          setInstructions("Segment créé avec mesure");
        } else {
          setSelectedPoints([newPoint]);
          setInstructions("Sélectionnez le deuxième point du segment");
        }
      }
      else if (currentTool === "square") {
        if (!isCreatingShape) {
          const newPoint = board.create("point", [x, y], {
            name: pointName,
            size: 3,
            color: "blue",
            fixed: false,
          }) as JXGElement;

          setPoints(prev => [...prev, newPoint]);
          setSelectedPoints([newPoint]);
          setIsCreatingShape(true);
          setInstructions("Cliquez pour définir la longueur du côté du carré");
        } else {
          const dx = x - selectedPoints[0].X();
          const dy = y - selectedPoints[0].Y();
          const sideLength = Math.sqrt(dx * dx + dy * dy);
          createSquare(selectedPoints[0], sideLength);
          setSelectedPoints([]);
          setIsCreatingShape(false);
          setInstructions("Carré créé");
        }
      }
      else if (currentTool === "isosceles") {
        if (!isCreatingShape) {
          const newPoint = board.create("point", [x, y], {
            name: pointName,
            size: 3,
            color: "blue",
            fixed: false,
          }) as JXGElement;

          setPoints(prev => [...prev, newPoint]);
          setSelectedPoints([newPoint]);
          setIsCreatingShape(true);
          setInstructions("Cliquez pour définir la longueur des côtés égaux");
        } else {
          const dx = x - selectedPoints[0].X();
          const dy = y - selectedPoints[0].Y();
          const sideLength = Math.sqrt(dx * dx + dy * dy);
          createIsoscelesTriangle(selectedPoints[0], 70, sideLength); // 70° comme dans l'exercice
          setSelectedPoints([]);
          setIsCreatingShape(false);
          setInstructions("Triangle isocèle créé");
        }
      }
      else if (currentTool === "angle") {
        const newPoint = board.create("point", [x, y], {
          name: pointName,
          size: 3,
          color: "orange",
          fixed: false,
        }) as JXGElement;

        setPoints(prev => [...prev, newPoint]);

        // Si on a au moins 3 points, on crée l'angle
        if (points.length >= 2) {
          const p1 = points[points.length - 2];
          const p2 = points[points.length - 1];
          const p3 = newPoint;

          createAngle(p1, p2, p3);
          setInstructions("Angle créé ! L'angle se mettra à jour automatiquement");
        } else {
          setInstructions("Placez encore un point pour créer l'angle");
        }
      }
    };

    board.on("down", handleClick);
    console.log("Écouteurs d'événements ajoutés");

    return () => {
      board.off("down", handleClick);
    };
  }, [board, currentTool, points.length, selectedPoints, isCreatingShape]);

  // Fonction pour créer un rapporteur
  const createProtractor = () => {
    if (board && points.length >= 2) {
      const center = points[points.length - 2] as any;
      const radius = points[points.length - 1] as any;

      // Créer un point pour définir l'angle de début (0°)
      const startPoint = board.create('point', [
        () => center.X() + (radius.X() - center.X()),
        () => center.Y()
      ], {
        visible: false,
        fixed: true
      });

      // Créer un point pour définir l'angle de fin (180°)
      const endPoint = board.create('point', [
        () => center.X() - (radius.X() - center.X()),
        () => center.Y()
      ], {
        visible: false,
        fixed: true
      });

      // Créer le rapporteur comme un arc passant par trois points
      const newProtractor = board.create('arc', [center, startPoint, endPoint], {
        strokeColor: 'gray',
        strokeWidth: 2,
        dash: 2,
        fillColor: 'none',
        highlightStrokeColor: 'gray'
      }) as unknown as JXGElement;

      // Ajouter les graduations tous les 10 degrés
      for (let angle = 0; angle <= 180; angle += 10) {
        const radian = (angle * Math.PI) / 180;
        const distance = Math.sqrt(
          Math.pow(radius.X() - center.X(), 2) + 
          Math.pow(radius.Y() - center.Y(), 2)
        );
        
        // Créer un petit trait pour la graduation
        board.create('segment', [
          [
            center.X() + (distance - 0.3) * Math.cos(radian),
            center.Y() + (distance - 0.3) * Math.sin(radian)
          ],
          [
            center.X() + distance * Math.cos(radian),
            center.Y() + distance * Math.sin(radian)
          ]
        ], {
          fixed: true,
          strokeColor: 'gray',
          strokeWidth: 1
        });

        // Ajouter le texte de l'angle
        if (angle % 30 === 0) {
          board.create('text', [
            center.X() + (distance + 0.5) * Math.cos(radian),
            center.Y() + (distance + 0.5) * Math.sin(radian),
            angle + '°'
          ], {
            fontSize: 12,
            fixed: true
          });
        }
      }

      setProtractor(newProtractor);
      setShowProtractor(true);
      setInstructions("Rapporteur créé ! Déplacez les points pour mesurer l'angle");
    } else {
      setInstructions("Placez d'abord deux points pour créer le rapporteur");
    }
  };

  // Fonction pour mesurer un angle avec le rapporteur
  const measureAngleWithProtractor = () => {
    if (board && protractor && points.length >= 3) {
      const p1 = points[points.length - 3];
      const p2 = points[points.length - 2];
      const p3 = points[points.length - 1];
      const angle = board.create("angle", [p1, p2, p3], {
        radius: 1,
        color: "red",
        orthotype: "sectordot",
        orthosensitivity: 0.5,
      });
      setAngles((prev) => [...prev, angle] as JXGElement[]);
      setInstructions("Angle mesuré ! Vous pouvez voir sa valeur");
    } else {
      setInstructions("Placez d'abord trois points pour mesurer un angle");
    }
  };

  // Fonction pour créer un angle de référence (30° ou 60°)
  const createReferenceAngle = (degrees: number) => {
    if (board && points.length >= 2) {
      const p1 = points[points.length - 2];
      const p2 = points[points.length - 1];
      
      // Créer un point pour le troisième sommet de l'angle
      const coords = board.getUsrCoordsOfMouse({ clientX: 0, clientY: 0 } as MouseEvent);
      const p3 = board.create("point", [coords[0], coords[1]], {
        name: "P" + (points.length + 1),
        size: 3,
        color: "green",
        fixed: false,
      });

      const angle = board.create("angle", [p1, p2, p3], {
        radius: 1,
        color: "green",
        orthotype: "sectordot",
        orthosensitivity: 0.5,
      });

      setPoints(prev => [...prev, p3]);
      setAngles(prev => [...prev, angle] as JXG.GeometryElement[]);
      setInstructions(`Angle de référence de ${degrees}° créé !`);
    } else {
      setInstructions("Placez d'abord deux points pour créer l'angle de référence");
    }
  };

  // Fonction pour extraire les données de la géométrie
  const getGeometryData = () => {
    const pointsData = points.map((p) => {
      const coords = (p as any).coords.usrCoords;
      return { name: p.name, x: coords[1], y: coords[2] };
    });

    const segmentsData = segments.map((seg) => {
      const vertices = (seg as any).vertices;
      return {
        from: vertices[0]?.name,
        to: vertices[1]?.name,
      };
    });

    const anglesData = angles.map((angle) => {
      const points = (angle as any).points;
      const measure = (angle as any).Value();
      return {
        p1: points[0].name,
        p2: points[1].name,
        p3: points[2].name,
        measure: measure,
      };
    });

    return {
      points: pointsData,
      segments: segmentsData,
      angles: anglesData,
      hasProtractor: showProtractor,
    };
  };

  // Fonction pour soumettre les données de géométrie à l'API de correction
  const handleSubmitGeometry = async () => {
    if (!board) return;
    const geometryData = getGeometryData();
    
    try {
      const res = await fetch("/api/checkGeometry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exercise: "Exercice de géométrie interactif",
          geometry: geometryData,
          userClass: "6",
        }),
      });
      const data = await res.json();
      console.log("Feedback géométrique :", data.feedback);
      setGeometryFeedback(data.feedback);
    } catch (error) {
      console.error("Erreur lors de la vérification de la géométrie :", error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        id="jxgboard" 
        className="w-full h-96 border border-gray-300 cursor-crosshair"
        style={{ touchAction: "none" }}
      />

      {/* Instructions en temps réel */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-2xl text-center">
        <p className="text-lg font-semibold">
          {instructions || "Sélectionnez un outil pour commencer"}
        </p>
      </div>

      {/* Panneau de contrôle principal */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        <button
          onClick={() => {
            setCurrentTool("move");
            setInstructions("Cliquez et déplacez les points pour modifier la figure");
          }}
          className={`flex flex-col items-center gap-1 ${
            currentTool === "move" ? "bg-gray-600" : "bg-gray-500"
          } hover:bg-gray-600 text-white py-1 px-2 rounded shadow-lg`}
        >
          <span className="text-base">✋</span>
          <span className="text-sm">Déplacer</span>
        </button>
        <button
          onClick={() => {
            setCurrentTool("point");
            setInstructions("Cliquez pour placer un point");
          }}
          className={`flex flex-col items-center gap-1 ${
            currentTool === "point" ? "bg-blue-600" : "bg-blue-500"
          } hover:bg-blue-600 text-white py-1 px-2 rounded shadow-lg`}
        >
          <span className="text-base">📍</span>
          <span className="text-sm">Point</span>
        </button>
        <button
          onClick={() => {
            setCurrentTool("segment");
            setInstructions("Cliquez pour placer le premier point du segment");
          }}
          className={`flex flex-col items-center gap-1 ${
            currentTool === "segment" ? "bg-green-600" : "bg-green-500"
          } hover:bg-green-600 text-white py-1 px-2 rounded shadow-lg`}
        >
          <span className="text-base">📏</span>
          <span className="text-sm">Segment</span>
        </button>
        <button
          onClick={() => {
            setCurrentTool("square");
            setInstructions("Cliquez pour placer le premier sommet du carré");
          }}
          className={`flex flex-col items-center gap-1 ${
            currentTool === "square" ? "bg-purple-600" : "bg-purple-500"
          } hover:bg-purple-600 text-white py-1 px-2 rounded shadow-lg`}
        >
          <span className="text-base">⬛</span>
          <span className="text-sm">Carré</span>
        </button>
        <button
          onClick={() => {
            setCurrentTool("isosceles");
            setInstructions("Cliquez pour placer le sommet principal du triangle isocèle");
          }}
          className={`flex flex-col items-center gap-1 ${
            currentTool === "isosceles" ? "bg-yellow-600" : "bg-yellow-500"
          } hover:bg-yellow-600 text-white py-1 px-2 rounded shadow-lg`}
        >
          <span className="text-base">△</span>
          <span className="text-sm">Triangle Isocèle</span>
        </button>
        <button
          onClick={() => {
            setCurrentTool("angle");
            setInstructions("Placez trois points pour créer un angle");
          }}
          className={`flex flex-col items-center gap-1 ${
            currentTool === "angle" ? "bg-orange-600" : "bg-orange-500"
          } hover:bg-orange-600 text-white py-1 px-2 rounded shadow-lg`}
        >
          <span className="text-base">📐</span>
          <span className="text-sm">Angle</span>
        </button>
        <button
          onClick={() => {
            setCurrentTool("eraser");
            setInstructions("Cliquez sur un élément pour l'effacer");
          }}
          className={`flex flex-col items-center gap-1 ${
            currentTool === "eraser" ? "bg-red-600" : "bg-red-500"
          } hover:bg-red-600 text-white py-1 px-2 rounded shadow-lg`}
        >
          <span className="text-base">🧹</span>
          <span className="text-sm">Gomme</span>
        </button>
        <button
          onClick={createProtractor}
          className={`flex flex-col items-center gap-1 ${
            showProtractor ? "bg-indigo-600" : "bg-indigo-500"
          } hover:bg-indigo-600 text-white py-1 px-2 rounded shadow-lg`}
        >
          <span className="text-base">📏</span>
          <span className="text-sm">Rapporteur</span>
        </button>
        <button
          onClick={handleSubmitGeometry}
          className="flex flex-col items-center gap-1 bg-teal-500 hover:bg-teal-600 text-white py-1 px-2 rounded shadow-lg"
        >
          <span className="text-base">✓</span>
          <span className="text-sm">Vérifier</span>
        </button>
      </div>

      {/* Instructions détaillées */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-2xl">
        <h3 className="text-lg font-bold mb-2">Comment utiliser les outils :</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>Déplacer : Cliquez et faites glisser les points pour modifier la figure</li>
          <li>Point : Cliquez pour placer un point sur le plan</li>
          <li>Segment : Cliquez deux points pour créer un segment mesuré</li>
          <li>Carré : Cliquez pour le premier sommet, puis pour définir la longueur du côté</li>
          <li>Triangle Isocèle : Cliquez pour le sommet principal, puis pour définir la longueur des côtés égaux</li>
          <li>Angle : Placez trois points pour créer et mesurer un angle</li>
          <li>Rapporteur : Placez deux points pour créer un rapporteur</li>
          <li>Gomme : Cliquez sur un élément pour l'effacer</li>
        </ol>
      </div>

      {/* Affichage du feedback */}
      {geometryFeedback && (
        <div className="mt-4 p-4 border rounded bg-white/90 max-w-2xl">
          <h3 className="text-lg font-bold mb-2">Analyse de votre construction :</h3>
          <div className="whitespace-pre-line">{geometryFeedback}</div>
        </div>
      )}
    </div>
  );
}

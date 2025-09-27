import React, { useState, useEffect } from "react";

// FirstAidQuizApp.jsx
// React app that loads quiz data from an external JSON file (first_aid_quizzes.json)
// Provides scenario selection, quiz answering, scoring, and result export.

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const FirstAidQuizApp = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarioScores, setScenarioScores] = useState({});
  const [showScores, setShowScores] = useState(false);

  useEffect(() => {
    // Load quiz data from JSON file in public folder
    fetch("/first_aid_quizzes.json")
      .then((res) => res.json())
      .then((data) => setQuizzes(data))
      .catch((err) => console.error("Error loading quiz data:", err));

    // Load saved scores from localStorage
    const savedScores = localStorage.getItem("ehbo-scenario-scores");
    if (savedScores) {
      try {
        setScenarioScores(JSON.parse(savedScores));
      } catch (error) {
        console.error("Error loading saved scores:", error);
      }
    }
  }, []);

  const handleSelectScenario = () => {
    const randomScenario = quizzes[Math.floor(Math.random() * quizzes.length)];
    const shuffledSteps = [...randomScenario.steps]
      .sort(() => Math.random() - 0.5)
      .map((step, index) => ({
        ...step,
        id: `step-${step.id}`, // Use original step id with consistent prefix
        draggableId: `step-${step.id}`, // Use same ID for both key and draggableId
        text: step.text.replace(/Stap \d+: /, ""),
        originalIndex: step.id - 1, // Store original order for scoring (0-based)
      }));
    console.log("Selected Scenario:", randomScenario);
    console.log("Shuffled Steps with IDs:", shuffledSteps);
    setSelectedScenario({
      ...randomScenario,
      steps: shuffledSteps,
    });
  };

  const handleBack = () => {
    setSelectedScenario(null);
  };

  const checkAnswer = () => {
    // Check if steps are in correct order
    const isCorrect = selectedScenario.steps.every(
      (step, index) => step.originalIndex === index
    );
    
    const scenarioKey = selectedScenario.scenario;
    const newScores = { ...scenarioScores };
    
    if (!newScores[scenarioKey]) {
      newScores[scenarioKey] = { attempts: 0, correct: 0 };
    }
    
    newScores[scenarioKey].attempts += 1;
    if (isCorrect) {
      newScores[scenarioKey].correct += 1;
    }
    
    setScenarioScores(newScores);
    
    // Save to localStorage
    localStorage.setItem("ehbo-scenario-scores", JSON.stringify(newScores));
    
    alert(
      isCorrect
        ? `Goed gedaan! De volgorde is correct. Score: ${newScores[scenarioKey].correct}/${newScores[scenarioKey].attempts}`
        : `De volgorde is niet correct. Probeer het opnieuw. Score: ${newScores[scenarioKey].correct}/${newScores[scenarioKey].attempts}`
    );
  };

  const ScoreGraph = () => {
    const totalAttempts = Object.values(scenarioScores).reduce((sum, score) => sum + score.attempts, 0);
    const totalCorrect = Object.values(scenarioScores).reduce((sum, score) => sum + score.correct, 0);
    const overallPercentage = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Scenario Scores</h3>
        <div className="mb-4 p-3 bg-white rounded shadow">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{overallPercentage}%</div>
            <div className="text-sm text-gray-600">Overall Success Rate</div>
            <div className="text-xs text-gray-500">{totalCorrect}/{totalAttempts} correct</div>
          </div>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {Object.entries(scenarioScores).map(([scenario, score]) => {
            const percentage = score.attempts > 0 ? Math.round((score.correct / score.attempts) * 100) : 0;
            return (
              <div key={scenario} className="bg-white p-2 rounded shadow">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-medium truncate flex-1 mr-2">
                    {scenario.length > 40 ? `${scenario.substring(0, 40)}...` : scenario}
                  </div>
                  <div className="text-sm font-bold text-blue-600">{percentage}%</div>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 ml-2">{score.correct}/{score.attempts}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        {Object.keys(scenarioScores).length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No scenarios completed yet. Complete some scenarios to see your progress!
          </div>
        )}
      </div>
    );
  };

  if (!quizzes.length) {
    return <div className="p-6 text-center">Laden...</div>;
  }

  if (!selectedScenario) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Eerste Hulp Quiz</h1>
        <p className="mb-4">
          Klik op de knop hieronder om een willekeurig scenario te starten:
        </p>
        <div className="flex gap-4 mb-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
            onClick={handleSelectScenario}
          >
            Get Random Scenario
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600"
            onClick={() => setShowScores(!showScores)}
          >
            {showScores ? 'Hide Scores' : 'Show Scores'}
          </button>
        </div>
        {showScores && <ScoreGraph />}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">{selectedScenario.scenario}</h2>
      <p className="text-sm text-gray-600 mb-4">
        Sleep de stappen in de juiste volgorde om het scenario correct af te handelen.
      </p>
      <DragDropContext
        onDragEnd={(result) => {
          console.log("Drag result:", result);
          if (!result.destination) {
            console.warn("No destination detected for drag.");
            return;
          }
          console.log("Steps before reorder:", selectedScenario.steps);
          const reorderedSteps = Array.from(selectedScenario.steps);
          const [moved] = reorderedSteps.splice(result.source.index, 1);
          reorderedSteps.splice(result.destination.index, 0, moved);
          console.log("Moved Step:", moved);
          console.log("Reordered Steps:", reorderedSteps);
          setSelectedScenario({ ...selectedScenario, steps: reorderedSteps });
        }}
      >
        <Droppable droppableId="steps">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {selectedScenario.steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="mb-2 p-3 bg-gray-100 rounded shadow cursor-move hover:bg-gray-200 transition-colors"
                    >
                      <span className="text-sm font-medium">{step.text}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex gap-4 mt-6">
        <button
          onClick={checkAnswer}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
        >
          Controleer Antwoord
        </button>

        <button
          onClick={handleBack}
          className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
        >
          ← Terug naar scenario's
        </button>
      </div>
    </div>
  );
};

export default FirstAidQuizApp;

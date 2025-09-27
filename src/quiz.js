import React, { useState, useEffect } from "react";

// FirstAidQuizApp.jsx
// React app that loads quiz data from an external JSON file (first_aid_quizzes.json)
// Provides scenario selection, quiz answering, scoring, and result export.

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const FirstAidQuizApp = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Load quiz data from JSON file in public folder
    fetch("/first_aid_quizzes.json")
      .then((res) => res.json())
      .then((data) => setQuizzes(data))
      .catch((err) => console.error("Error loading quiz data:", err));
  }, []);

  const handleSelectScenario = () => {
    const randomScenario = quizzes[Math.floor(Math.random() * quizzes.length)];
    const shuffledSteps = [...randomScenario.steps]
      .sort(() => Math.random() - 0.5)
      .map((step, index) => ({
        ...step,
        id: `${randomScenario.scenario}-${index}`
          .replace(/[^a-zA-Z0-9]/g, "_") // Replace special characters with underscores
          .toLowerCase(), // Ensure consistent formatting
        text: step.text.replace(/Stap \d+: /, ""),
      }));
    console.log("Selected Scenario:", randomScenario);
    console.log("Shuffled Steps with IDs:", shuffledSteps);
    setSelectedScenario({
      ...randomScenario,
      steps: shuffledSteps.map((step, index) => ({ ...step, order: index })),
    });
    setAnswers({});
    setSubmitted(false);
  };

  const handleChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleBack = () => {
    setSelectedScenario(null);
    setSubmitted(false);
    setAnswers({});
  };

  const exportResults = () => {
    const rows = Object.keys(answers).map((id) => {
      const step = selectedScenario.steps.find((s) => s.id === parseInt(id));
      return {
        Scenario: selectedScenario.scenario,
        Step: step.text,
        Answer: answers[id] ? "Ja" : "Nee",
        Correct: step.correct ? "Ja" : "Nee",
      };
    });
    const csv =
      "Scenario,Step,Answer,Correct\n" +
      rows
        .map((r) => `${r.Scenario},"${r.Step}",${r.Answer},${r.Correct}`)
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!quizzes.length) {
    return <div className="p-6 text-center">Laden...</div>;
  }

  if (!selectedScenario) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Eerste Hulp Quiz</h1>
        <p className="mb-4">
          Klik op de knop hieronder om een willekeurig scenario te starten:
        </p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
          onClick={handleSelectScenario}
        >
          Get Random Scenario
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">{selectedScenario.scenario}</h2>
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
                      className="mb-2 p-2 bg-gray-100 rounded shadow"
                    >
                      <span>{step.text}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        onClick={() => {
          const isCorrect = selectedScenario.steps.every(
            (step, index) => step.order === index
          );
          alert(
            isCorrect
              ? "Goed gedaan! De volgorde is correct."
              : "De volgorde is niet correct. Probeer het opnieuw."
          );
        }}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow"
      >
        Controleer Antwoord
      </button>

      <button
        onClick={handleBack}
        className="mt-6 px-4 py-2 bg-gray-400 text-white rounded-lg"
      >
        ← Terug naar scenario's
      </button>
    </div>
  );
};

export default FirstAidQuizApp;

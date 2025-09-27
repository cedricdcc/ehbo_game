import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FirstAidQuizApp from './quiz';

// Mock the fetch function
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock data for testing
const mockQuizData = [
  {
    "scenario": "Test Scenario 1",
    "steps": [
      { "id": 1, "text": "Step 1: First step", "correct": true },
      { "id": 2, "text": "Step 2: Second step", "correct": true },
      { "id": 3, "text": "Step 3: Third step", "correct": true }
    ]
  },
  {
    "scenario": "Test Scenario 2", 
    "steps": [
      { "id": 1, "text": "Step 1: Different first step", "correct": true },
      { "id": 2, "text": "Step 2: Different second step", "correct": true }
    ]
  }
];

describe('FirstAidQuizApp', () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      json: () => Promise.resolve(mockQuizData),
    });
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial loading state', () => {
    fetch.mockResolvedValue(new Promise(() => {})); // Never resolves
    render(<FirstAidQuizApp />);
    expect(screen.getByText('Laden...')).toBeInTheDocument();
  });

  test('renders main menu after loading', async () => {
    render(<FirstAidQuizApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Eerste Hulp Quiz')).toBeInTheDocument();
      expect(screen.getByText('Get Random Scenario')).toBeInTheDocument();
      expect(screen.getByText('Show Scores')).toBeInTheDocument();
    });
  });

  test('loads quiz data from fetch', async () => {
    render(<FirstAidQuizApp />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/first_aid_quizzes.json');
    });
  });

  test('shows scores section when clicking Show Scores', async () => {
    render(<FirstAidQuizApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Show Scores')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Show Scores'));
    
    expect(screen.getByText('Scenario Scores')).toBeInTheDocument();
    expect(screen.getByText('Overall Success Rate')).toBeInTheDocument();
    expect(screen.getByText('No scenarios completed yet. Complete some scenarios to see your progress!')).toBeInTheDocument();
  });

  test('hides scores section when clicking Hide Scores', async () => {
    render(<FirstAidQuizApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Show Scores')).toBeInTheDocument();
    });

    // Show scores first
    fireEvent.click(screen.getByText('Show Scores'));
    expect(screen.getByText('Scenario Scores')).toBeInTheDocument();

    // Then hide scores
    fireEvent.click(screen.getByText('Hide Scores'));
    expect(screen.queryByText('Scenario Scores')).not.toBeInTheDocument();
  });

  test('starts a random scenario when clicking Get Random Scenario', async () => {
    // Mock Math.random to return a predictable value
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    
    render(<FirstAidQuizApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Get Random Scenario')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Get Random Scenario'));

    await waitFor(() => {
      expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
      expect(screen.getByText('Sleep de stappen in de juiste volgorde om het scenario correct af te handelen. Je kunt ook de pijltjes gebruiken om stappen te verplaatsen.')).toBeInTheDocument();
      expect(screen.getByText('Controleer Antwoord')).toBeInTheDocument();
      expect(screen.getByText('← Terug naar scenario\'s')).toBeInTheDocument();
    });

    Math.random.mockRestore();
  });

  test('displays up/down arrow buttons for reordering steps', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    
    render(<FirstAidQuizApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Get Random Scenario')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Get Random Scenario'));

    await waitFor(() => {
      // Check that arrow buttons are present
      const upArrows = screen.getAllByText('↑');
      const downArrows = screen.getAllByText('↓');
      
      expect(upArrows.length).toBeGreaterThan(0);
      expect(downArrows.length).toBeGreaterThan(0);
      
      // First item should have disabled up arrow
      expect(upArrows[0]).toBeDisabled();
      // Last item should have disabled down arrow
      expect(downArrows[downArrows.length - 1]).toBeDisabled();
    });

    Math.random.mockRestore();
  });

  test('can move steps using up/down arrow buttons', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    
    render(<FirstAidQuizApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Get Random Scenario')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Get Random Scenario'));

    await waitFor(() => {
      const downArrows = screen.getAllByText('↓');
      expect(downArrows.length).toBeGreaterThan(0);
      
      // Click the first down arrow to move the first step down
      fireEvent.click(downArrows[0]);
      
      // The button states should update correctly
      const upArrows = screen.getAllByText('↑');
      expect(upArrows[0]).toBeDisabled(); // New first item should have disabled up arrow
    });

    Math.random.mockRestore();
  });

  test('can go back to main menu from scenario', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    
    render(<FirstAidQuizApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Get Random Scenario')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Get Random Scenario'));

    await waitFor(() => {
      expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('← Terug naar scenario\'s'));

    expect(screen.getByText('Eerste Hulp Quiz')).toBeInTheDocument();
    expect(screen.getByText('Get Random Scenario')).toBeInTheDocument();

    Math.random.mockRestore();
  });

  test('saves scores to localStorage when checking answer', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    // Mock window.alert
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<FirstAidQuizApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Get Random Scenario')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Get Random Scenario'));

    await waitFor(() => {
      expect(screen.getByText('Controleer Antwoord')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Controleer Antwoord'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ehbo-scenario-scores',
        expect.stringContaining('Test Scenario 1')
      );
    });

    window.alert.mockRestore();
    Math.random.mockRestore();
  });

  test('loads saved scores from localStorage on component mount', () => {
    const savedScores = JSON.stringify({
      'Test Scenario 1': { attempts: 2, correct: 1 }
    });
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'ehbo-scenario-scores') {
        return savedScores;
      }
      return null;
    });

    render(<FirstAidQuizApp />);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('ehbo-scenario-scores');
  });

  test('handles localStorage parse error gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<FirstAidQuizApp />);

    expect(consoleSpy).toHaveBeenCalledWith('Error loading saved scores:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  test('displays correct score percentages in score graph', async () => {
    const savedScores = JSON.stringify({
      'Test Scenario 1': { attempts: 4, correct: 3 }
    });
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'ehbo-scenario-scores') {
        return savedScores;
      }
      return null;
    });

    render(<FirstAidQuizApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Show Scores')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Show Scores'));

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument(); // Overall percentage
      expect(screen.getByText('3/4 correct')).toBeInTheDocument(); // Overall count
    });
  });
});
import React, { useState, useEffect } from 'react';

export default function FoodDiary() {
  const [foodEntries, setFoodEntries] = useState([]);
  const [symptomEntries, setSymptomEntries] = useState([]);
  const [medicationEntries, setMedicationEntries] = useState([]);
  const [drinkEntries, setDrinkEntries] = useState([]);
  const [analysisEntries, setAnalysisEntries] = useState([]);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [showDrinkForm, setShowDrinkForm] = useState(false);
  const [showAnalyzeOptions, setShowAnalyzeOptions] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [questionTimeframe, setQuestionTimeframe] = useState(1);
  const [questionAnswer, setQuestionAnswer] = useState(null);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const [pageSize] = useState(10);
  const [currentPages, setCurrentPages] = useState({
    timeline: 1,
    food: 1,
    symptoms: 1,
    medications: 1,
    drinks: 1,
    analysis: 1
  });
  
  const [foodFormData, setFoodFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    food: '',
    notes: ''
  });

  const [symptomFormData, setSymptomFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    symptomScore: 5,
    notes: ''
  });

  const [medicationFormData, setMedicationFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    medication: '',
    dosage: '',
    notes: ''
  });

  const [drinkFormData, setDrinkFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    drink: '',
    amount: '',
    notes: ''
  });

  // Silent re-authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/.auth/me');
        if (!response.ok) {
          window.location.href = '/.auth/login/aad?post_login_redirect_uri=' + window.location.pathname;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const [foodResponse, symptomResponse, medicationResponse, drinkResponse, analysisResponse] = await Promise.all([
        fetch('/api/food'),
        fetch('/api/symptoms'),
        fetch('/api/medications'),
        fetch('/api/drinks'),
        fetch('/api/analysis')
      ]);
      
      if (foodResponse.ok) {
        const foodData = await foodResponse.json();
        setFoodEntries(foodData.sort((a, b) => 
          new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
        ));
      }

      if (symptomResponse.ok) {
        const symptomData = await symptomResponse.json();
        setSymptomEntries(symptomData.sort((a, b) => 
          new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
        ));
      }

      if (medicationResponse.ok) {
        const medicationData = await medicationResponse.json();
        setMedicationEntries(medicationData.sort((a, b) => 
          new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
        ));
      }

      if (drinkResponse.ok) {
        const drinkData = await drinkResponse.json();
        setDrinkEntries(drinkData.sort((a, b) => 
          new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
        ));
      }

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalysisEntries(analysisData.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        ));
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
    setLoading(false);
  };

  const saveFoodEntry = async () => {
    if (!foodFormData.food) {
      alert('Please enter the food/meal');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(foodFormData)
      });
      
      if (response.ok) {
        await loadEntries();
        setFoodFormData({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          food: '',
          notes: ''
        });
        setShowFoodForm(false);
      } else {
        alert('Failed to save food entry');
      }
    } catch (error) {
      console.error('Error saving food entry:', error);
      alert('Failed to save entry.');
    }
    setLoading(false);
  };

  const saveSymptomEntry = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(symptomFormData)
      });
      
      if (response.ok) {
        await loadEntries();
        setSymptomFormData({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          symptomScore: 5,
          notes: ''
        });
        setShowSymptomForm(false);
      } else {
        alert('Failed to save symptom entry');
      }
    } catch (error) {
      console.error('Error saving symptom entry:', error);
      alert('Failed to save entry.');
    }
    setLoading(false);
  };

  const saveMedicationEntry = async () => {
    if (!medicationFormData.medication) {
      alert('Please enter the medication/supplement name');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicationFormData)
      });
      
      if (response.ok) {
        await loadEntries();
        setMedicationFormData({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          medication: '',
          dosage: '',
          notes: ''
        });
        setShowMedicationForm(false);
      } else {
        alert('Failed to save medication entry');
      }
    } catch (error) {
      console.error('Error saving medication entry:', error);
      alert('Failed to save entry.');
    }
    setLoading(false);
  };

  const saveDrinkEntry = async () => {
    if (!drinkFormData.drink) {
      alert('Please enter the drink name');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/drinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drinkFormData)
      });
      
      if (response.ok) {
        await loadEntries();
        setDrinkFormData({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          drink: '',
          amount: '',
          notes: ''
        });
        setShowDrinkForm(false);
      } else {
        alert('Failed to save drink entry');
      }
    } catch (error) {
      console.error('Error saving drink entry:', error);
      alert('Failed to save entry.');
    }
    setLoading(false);
  };

  const analyzePatterns = async (days) => {
    setShowAnalyzeOptions(false);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredFood = foodEntries.filter(e => 
      new Date(e.date + ' ' + e.time) >= cutoffDate
    );
    const filteredSymptoms = symptomEntries.filter(e => 
      new Date(e.date + ' ' + e.time) >= cutoffDate
    );

    if (filteredFood.length < 2 || filteredSymptoms.length < 2) {
      alert(`Not enough data in the last ${days} day(s). Need at least 2 food and 2 symptom entries.`);
      return;
    }
    
    setAnalyzing(true);
    
    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          foodEntries: filteredFood,
          symptomEntries: filteredSymptoms,
          days
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && (data.success || data.analysis)) {
          await loadEntries();
          setActiveTab('analysis');
          alert('Analysis complete! View it in the Analysis tab.');
        } else {
          alert('Analysis failed - unexpected response format');
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to analyze patterns: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error analyzing:', error);
      alert('Failed to analyze.');
    }
    setAnalyzing(false);
  };

  const askQuestion = async () => {
    if (!questionText.trim()) {
      alert('Please enter a question');
      return;
    }

    setAskingQuestion(true);
    setQuestionAnswer(null);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - questionTimeframe);
    
    const filteredFood = foodEntries.filter(e => 
      new Date(e.date + ' ' + e.time) >= cutoffDate
    );
    const filteredSymptoms = symptomEntries.filter(e => 
      new Date(e.date + ' ' + e.time) >= cutoffDate
    );
    const filteredMedications = medicationEntries.filter(e => 
      new Date(e.date + ' ' + e.time) >= cutoffDate
    );
    const filteredDrinks = drinkEntries.filter(e => 
      new Date(e.date + ' ' + e.time) >= cutoffDate
    );

    try {
      const response = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: questionText,
          days: questionTimeframe,
          foodEntries: filteredFood,
          symptomEntries: filteredSymptoms,
          medicationEntries: filteredMedications,
          drinkEntries: filteredDrinks
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.answer) {
          setQuestionAnswer(data.answer);
        } else {
          alert('Failed to get answer');
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to ask question: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error asking question:', error);
      alert('Failed to ask question.');
    }
    setAskingQuestion(false);
  };

  const getSymptomColor = (score) => {
    if (score <= 3) return 'bg-green-100 text-green-800 border-green-300';
    if (score <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getCombinedTimeline = () => {
    const combined = [
      ...foodEntries.map(e => ({ ...e, type: 'food' })),
      ...symptomEntries.map(e => ({ ...e, type: 'symptom' })),
      ...medicationEntries.map(e => ({ ...e, type: 'medication' })),
      ...drinkEntries.map(e => ({ ...e, type: 'drink' }))
    ];
    return combined.sort((a, b) => 
      new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
    );
  };

  const getPaginatedData = (data, page) => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  };

  const hasMoreData = (data, page) => {
    return data.length > page * pageSize;
  };

  const loadMore = (tab) => {
    setCurrentPages(prev => ({ ...prev, [tab]: prev[tab] + 1 }));
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTimelineEntry = (entry, idx) => {
    let bgColor, icon, mainText;
    
    switch(entry.type) {
      case 'food':
        bgColor = 'bg-indigo-50 border-indigo-200';
        icon = '🍽️';
        mainText = entry.food;
        break;
      case 'symptom':
        bgColor = getSymptomColor(entry.symptomScore);
        icon = '📊';
        mainText = `Symptom Level: ${entry.symptomScore}/10`;
        break;
      case 'medication':
        bgColor = 'bg-purple-50 border-purple-200';
        icon = '💊';
        mainText = `${entry.medication}${entry.dosage ? ' - ' + entry.dosage : ''}`;
        break;
      case 'drink':
        bgColor = 'bg-amber-50 border-amber-200';
        icon = '🍺';
        mainText = `${entry.drink}${entry.amount ? ' - ' + entry.amount : ''}`;
        break;
      default:
        return null;
    }

    return (
      <div key={idx} className={`p-4 rounded-lg border-2 ${bgColor}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <div>
              <div className="font-semibold text-gray-800">{mainText}</div>
              <div className="text-sm text-gray-600">{entry.date} at {entry.time}</div>
            </div>
          </div>
        </div>
        {entry.notes && (
          <div className="text-sm text-gray-600 mt-2 italic pl-6">{entry.notes}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">📅</span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Health Diary</h1>
            </div>
            
            <div className="flex flex-col gap-3 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowFoodForm(!showFoodForm)}
                  className="bg-indigo-600 text-white px-3 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition text-sm"
                >
                  <span>🍽️</span>
                  <span>Food</span>
                </button>
                <button
                  onClick={() => setShowSymptomForm(!showSymptomForm)}
                  className="bg-orange-600 text-white px-3 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition text-sm"
                >
                  <span>📊</span>
                  <span>Symptom</span>
                </button>
                <button
                  onClick={() => setShowMedicationForm(!showMedicationForm)}
                  className="bg-purple-600 text-white px-3 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700 transition text-sm"
                >
                  <span>💊</span>
                  <span>Medication</span>
                </button>
                <button
                  onClick={() => setShowDrinkForm(!showDrinkForm)}
                  className="bg-amber-600 text-white px-3 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-700 transition text-sm"
                >
                  <span>🍺</span>
                  <span>Drink</span>
                </button>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowAnalyzeOptions(!showAnalyzeOptions)}
                  disabled={analyzing || foodEntries.length < 2 || symptomEntries.length < 2}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 disabled:bg-gray-400 transition w-full"
                >
                  <span>📈</span>
                  <span>{analyzing ? 'Analyzing...' : 'Analyze Patterns'}</span>
                </button>
                
                {showAnalyzeOptions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="p-2">
                      <div className="text-sm font-semibold text-gray-700 px-3 py-2">Analyze data from:</div>
                      <button onClick={() => analyzePatterns(1)} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">Last 24 hours</button>
                      <button onClick={() => analyzePatterns(3)} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">Last 3 days</button>
                      <button onClick={() => analyzePatterns(7)} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">Last week</button>
                      <button onClick={() => analyzePatterns(30)} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">Last month</button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowQuestionDialog(true)}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition w-full"
              >
                <span>💬</span>
                <span>Ask a Question</span>
              </button>
            </div>
          </div>

          {showQuestionDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>💬</span>
                    Ask a Question About Your Data
                  </h2>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setQuestionTimeframe(1)}
                        className={`px-4 py-2 rounded ${questionTimeframe === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Last 24 hours
                      </button>
                      <button
                        onClick={() => setQuestionTimeframe(3)}
                        className={`px-4 py-2 rounded ${questionTimeframe === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Last 3 days
                      </button>
                      <button
                        onClick={() => setQuestionTimeframe(7)}
                        className={`px-4 py-2 rounded ${questionTimeframe === 7 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Last week
                      </button>
                      <button
                        onClick={() => setQuestionTimeframe(30)}
                        className={`px-4 py-2 rounded ${questionTimeframe === 30 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Last month
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Question</label>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="e.g., Which of these foods contain soluble fibre and how often have I had them?"
                      className="w-full p-3 border border-gray-300 rounded h-32 resize-none"
                      disabled={askingQuestion}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Examples: "What symptoms happened after eating dairy?", "How much alcohol did I drink?", "Which medications did I take most often?"
                    </div>
                  </div>

                  {questionAnswer && (
                    <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <span>💡</span>
                        Answer:
                      </h3>
                      <div className="text-gray-700 whitespace-pre-wrap">{questionAnswer}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={askQuestion}
                      disabled={askingQuestion || !questionText.trim()}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex-1"
                    >
                      {askingQuestion ? 'Asking...' : 'Ask Question'}
                    </button>
                    <button
                      onClick={() => {
                        setShowQuestionDialog(false);
                        setQuestionText('');
                        setQuestionAnswer(null);
                        setQuestionTimeframe(1);
                      }}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                      disabled={askingQuestion}
                    >
                      Close
                    </button>
                  </div>
                </div>
                  </div>
                </div>
              //</div>
            )}

          {showFoodForm && (
            <div className="bg-indigo-50 p-6 rounded-lg mb-6 border-2 border-indigo-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🍽️</span>Log Food Entry
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={foodFormData.date} onChange={(e) => setFoodFormData({...foodFormData, date: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={foodFormData.time} onChange={(e) => setFoodFormData({...foodFormData, time: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Food/Meal</label>
                <input type="text" value={foodFormData.food} onChange={(e) => setFoodFormData({...foodFormData, food: e.target.value})} placeholder="e.g., Pasta, coffee" className="w-full p-2 border border-gray-300 rounded" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={foodFormData.notes} onChange={(e) => setFoodFormData({...foodFormData, notes: e.target.value})} placeholder="Portion size, etc." className="w-full p-2 border border-gray-300 rounded h-20" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveFoodEntry} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setShowFoodForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          )}

          {showSymptomForm && (
            <div className="bg-orange-50 p-6 rounded-lg mb-6 border-2 border-orange-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📊</span>Log Symptom Entry
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={symptomFormData.date} onChange={(e) => setSymptomFormData({...symptomFormData, date: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={symptomFormData.time} onChange={(e) => setSymptomFormData({...symptomFormData, time: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptom Severity: {symptomFormData.symptomScore} 
                  <span className="text-gray-500 text-xs ml-2">(1 = fine, 10 = agony)</span>
                </label>
                <input type="range" min="1" max="10" value={symptomFormData.symptomScore} onChange={(e) => setSymptomFormData({...symptomFormData, symptomScore: parseInt(e.target.value)})} className="w-full" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Fine</span><span>Moderate</span><span>Severe</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={symptomFormData.notes} onChange={(e) => setSymptomFormData({...symptomFormData, notes: e.target.value})} placeholder="Type of pain, location, etc." className="w-full p-2 border border-gray-300 rounded h-20" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveSymptomEntry} disabled={loading} className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setShowSymptomForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          )}

          {showMedicationForm && (
            <div className="bg-purple-50 p-6 rounded-lg mb-6 border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>💊</span>Log Medication/Supplement
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={medicationFormData.date} onChange={(e) => setMedicationFormData({...medicationFormData, date: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={medicationFormData.time} onChange={(e) => setMedicationFormData({...medicationFormData, time: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication/Supplement</label>
                <input type="text" value={medicationFormData.medication} onChange={(e) => setMedicationFormData({...medicationFormData, medication: e.target.value})} placeholder="e.g., Ibuprofen, Vitamin D" className="w-full p-2 border border-gray-300 rounded" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage (optional)</label>
                <input type="text" value={medicationFormData.dosage} onChange={(e) => setMedicationFormData({...medicationFormData, dosage: e.target.value})} placeholder="e.g., 200mg, 2 tablets" className="w-full p-2 border border-gray-300 rounded" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={medicationFormData.notes} onChange={(e) => setMedicationFormData({...medicationFormData, notes: e.target.value})} placeholder="Reason, side effects, etc." className="w-full p-2 border border-gray-300 rounded h-20" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveMedicationEntry} disabled={loading} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setShowMedicationForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          )}

          {showDrinkForm && (
            <div className="bg-amber-50 p-6 rounded-lg mb-6 border-2 border-amber-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🍺</span>Log Alcoholic Drink
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={drinkFormData.date} onChange={(e) => setDrinkFormData({...drinkFormData, date: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={drinkFormData.time} onChange={(e) => setDrinkFormData({...drinkFormData, time: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Drink</label>
                <input type="text" value={drinkFormData.drink} onChange={(e) => setDrinkFormData({...drinkFormData, drink: e.target.value})} placeholder="e.g., Beer, Wine, Whiskey" className="w-full p-2 border border-gray-300 rounded" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (optional)</label>
                <input type="text" value={drinkFormData.amount} onChange={(e) => setDrinkFormData({...drinkFormData, amount: e.target.value})} placeholder="e.g., 1 pint, 2 glasses, 50ml" className="w-full p-2 border border-gray-300 rounded" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={drinkFormData.notes} onChange={(e) => setDrinkFormData({...drinkFormData, notes: e.target.value})} placeholder="Brand, context, etc." className="w-full p-2 border border-gray-300 rounded h-20" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveDrinkEntry} disabled={loading} className="bg-amber-600 text-white px-6 py-2 rounded hover:bg-amber-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setShowDrinkForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              <button onClick={() => setActiveTab('timeline')} className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === 'timeline' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Timeline</button>
              <button onClick={() => setActiveTab('food')} className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === 'food' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Food</button>
              <button onClick={() => setActiveTab('symptoms')} className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === 'symptoms' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Symptoms</button>
              <button onClick={() => setActiveTab('medications')} className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === 'medications' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Medications</button>
              <button onClick={() => setActiveTab('drinks')} className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === 'drinks' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Drinks</button>
              <button onClick={() => setActiveTab('analysis')} className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === 'analysis' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Analysis</button>
            </div>
          </div>

          {loading && foodEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading entries...</div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'timeline' && (
                <>
                  {getCombinedTimeline().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No entries yet. Start logging!</div>
                  ) : (
                    <>
                      {getPaginatedData(getCombinedTimeline(), currentPages.timeline).map((entry, idx) => renderTimelineEntry(entry, idx))}
                      {hasMoreData(getCombinedTimeline(), currentPages.timeline) && (
                        <button onClick={() => loadMore('timeline')} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded mt-3">Load More</button>
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === 'food' && (
                <>
                  {foodEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No food entries yet.</div>
                  ) : (
                    <>
                      {getPaginatedData(foodEntries, currentPages.food).map((entry, idx) => (
                        <div key={idx} className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🍽️</span>
                            <div>
                              <div className="font-semibold text-gray-800">{entry.food}</div>
                              <div className="text-sm text-gray-600">{entry.date} at {entry.time}</div>
                            </div>
                          </div>
                          {entry.notes && <div className="text-sm text-gray-600 mt-2 italic pl-6">{entry.notes}</div>}
                        </div>
                      ))}
                      {hasMoreData(foodEntries, currentPages.food) && (
                        <button onClick={() => loadMore('food')} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded mt-3">Load More</button>
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === 'symptoms' && (
                <>
                  {symptomEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No symptom entries yet.</div>
                  ) : (
                    <>
                      {getPaginatedData(symptomEntries, currentPages.symptoms).map((entry, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border-2 ${getSymptomColor(entry.symptomScore)}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📊</span>
                              <div>
                                <div className="font-semibold text-gray-800">Symptom Level: {entry.symptomScore}/10</div>
                                <div className="text-sm text-gray-600">{entry.date} at {entry.time}</div>
                              </div>
                            </div>
                          </div>
                          {entry.notes && <div className="text-sm text-gray-600 mt-2 italic pl-6">{entry.notes}</div>}
                        </div>
                      ))}
                      {hasMoreData(symptomEntries, currentPages.symptoms) && (
                        <button onClick={() => loadMore('symptoms')} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded mt-3">Load More</button>
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === 'medications' && (
                <>
                  {medicationEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No medication entries yet.</div>
                  ) : (
                    <>
                      {getPaginatedData(medicationEntries, currentPages.medications).map((entry, idx) => (
                        <div key={idx} className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">💊</span>
                            <div>
                              <div className="font-semibold text-gray-800">{entry.medication}{entry.dosage ? ` - ${entry.dosage}` : ''}</div>
                              <div className="text-sm text-gray-600">{entry.date} at {entry.time}</div>
                            </div>
                          </div>
                          {entry.notes && <div className="text-sm text-gray-600 mt-2 italic pl-6">{entry.notes}</div>}
                        </div>
                      ))}
                      {hasMoreData(medicationEntries, currentPages.medications) && (
                        <button onClick={() => loadMore('medications')} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded mt-3">Load More</button>
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === 'drinks' && (
                <>
                  {drinkEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No drink entries yet.</div>
                  ) : (
                    <>
                      {getPaginatedData(drinkEntries, currentPages.drinks).map((entry, idx) => (
                        <div key={idx} className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🍺</span>
                            <div>
                              <div className="font-semibold text-gray-800">{entry.drink}{entry.amount ? ` - ${entry.amount}` : ''}</div>
                              <div className="text-sm text-gray-600">{entry.date} at {entry.time}</div>
                            </div>
                          </div>
                          {entry.notes && <div className="text-sm text-gray-600 mt-2 italic pl-6">{entry.notes}</div>}
                        </div>
                      ))}
                      {hasMoreData(drinkEntries, currentPages.drinks) && (
                        <button onClick={() => loadMore('drinks')} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded mt-3">Load More</button>
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === 'analysis' && (
                <>
                  {analysisEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No analysis results yet. Click "Analyze Patterns" to generate insights.</div>
                  ) : (
                    <>
                      {getPaginatedData(analysisEntries, currentPages.analysis).map((entry, idx) => (
                        <div key={idx} className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">💡</span>
                            <div>
                              <div className="font-bold text-gray-800">Analysis: Last {entry.days} day{entry.days > 1 ? 's' : ''}</div>
                              <div className="text-sm text-gray-600">{formatDate(entry.timestamp)}</div>
                            </div>
                          </div>
                          <div className="text-gray-700 whitespace-pre-wrap">{entry.analysis}</div>
                        </div>
                      ))}
                      {hasMoreData(analysisEntries, currentPages.analysis) && (
                        <button onClick={() => loadMore('analysis')} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded mt-3">Load More</button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
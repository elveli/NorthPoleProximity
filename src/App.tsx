import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { MapPin, Globe, Loader2, Navigation } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface CityData {
  name: string;
  latitude: number;
  longitude: number;
}

interface ComparisonResult {
  city1: CityData;
  city2: CityData;
  moreNorthernCity: string;
  latitudeDifferenceDegrees: number;
  distanceDifferenceKm: number;
  distanceDifferenceMiles: number;
  explanation: string;
}

export default function App() {
  const [city1, setCity1] = useState('');
  const [city2, setCity2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState('');

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city1.trim() || !city2.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Compare the locations of "${city1}" and "${city2}". 
        Determine their coordinates. 
        Identify which city is further north (closer to the North Pole).
        Calculate the difference in latitude degrees.
        Calculate the distance difference in terms of closeness to the North Pole (1 degree latitude is approximately 111.1 km or 69 miles).
        Return the result as JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city1: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER },
                },
                required: ['name', 'latitude', 'longitude'],
              },
              city2: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER },
                },
                required: ['name', 'latitude', 'longitude'],
              },
              moreNorthernCity: { type: Type.STRING, description: "Name of the city that is further north" },
              latitudeDifferenceDegrees: { type: Type.NUMBER },
              distanceDifferenceKm: { type: Type.NUMBER },
              distanceDifferenceMiles: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
            },
            required: [
              'city1',
              'city2',
              'moreNorthernCity',
              'latitudeDifferenceDegrees',
              'distanceDifferenceKm',
              'distanceDifferenceMiles',
              'explanation'
            ],
          },
        },
      });

      if (response.text) {
        const data = JSON.parse(response.text) as ComparisonResult;
        setResult(data);
      } else {
        setError('Failed to get a valid response from the AI.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while comparing the cities.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-slate-200 rounded-full mb-2">
            <Globe className="w-8 h-8 text-slate-700" />
          </div>
          <h1 className="text-4xl font-light tracking-tight text-slate-900">North Pole Proximity</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Enter two cities to find out which one is further north and calculate the exact distance difference to the North Pole.
          </p>
        </header>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <form onSubmit={handleCompare} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="city1" className="text-sm font-medium text-slate-700 ml-1">First City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="city1"
                    type="text"
                    value={city1}
                    onChange={(e) => setCity1(e.target.value)}
                    placeholder="e.g., London, UK"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="city2" className="text-sm font-medium text-slate-700 ml-1">Second City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="city2"
                    type="text"
                    value={city2}
                    onChange={(e) => setCity2(e.target.value)}
                    placeholder="e.g., New York, NY"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !city1.trim() || !city2.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  <span>Compare Cities</span>
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-medium text-slate-900">
                <span className="font-bold text-indigo-600">{result.moreNorthernCity}</span> is further north!
              </h2>
              <p className="text-slate-500">{result.explanation}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-6 rounded-2xl text-center space-y-1">
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-2">Latitude Diff</div>
                <div className="text-3xl font-light text-slate-900">{result.latitudeDifferenceDegrees.toFixed(2)}°</div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl text-center space-y-1">
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-2">Distance (km)</div>
                <div className="text-3xl font-light text-slate-900">{result.distanceDifferenceKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km</div>
                <div className="text-xs text-slate-400 mt-1">closer to North Pole</div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl text-center space-y-1">
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-2">Distance (miles)</div>
                <div className="text-3xl font-light text-slate-900">{result.distanceDifferenceMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })} mi</div>
                <div className="text-xs text-slate-400 mt-1">closer to North Pole</div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-medium text-slate-900 mb-4 uppercase tracking-wider">Coordinates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">{result.city1.name}</div>
                    <div className="text-sm text-slate-500 font-mono mt-1">
                      {Math.abs(result.city1.latitude).toFixed(4)}° {result.city1.latitude >= 0 ? 'N' : 'S'}, {Math.abs(result.city1.longitude).toFixed(4)}° {result.city1.longitude >= 0 ? 'E' : 'W'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">{result.city2.name}</div>
                    <div className="text-sm text-slate-500 font-mono mt-1">
                      {Math.abs(result.city2.latitude).toFixed(4)}° {result.city2.latitude >= 0 ? 'N' : 'S'}, {Math.abs(result.city2.longitude).toFixed(4)}° {result.city2.longitude >= 0 ? 'E' : 'W'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

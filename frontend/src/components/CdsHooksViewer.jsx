import React, { useState, useEffect } from 'react';
import {
  Server, ShieldAlert, CheckCircle2, FileCode, Play, Copy, Check,
  ExternalLink, Layers, ArrowRight, Activity, AlertTriangle, Info
} from 'lucide-react';

export default function CdsHooksViewer({ patient, selectedPersonaId, apiBase, prediction }) {
  const [loadingHook, setLoadingHook] = useState(false);
  const [cdsResponse, setCdsResponse] = useState(null);
  const [fhirBundle, setFhirBundle] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('cards'); // 'cards' | 'fhir' | 'baselines' | 'raw_hook'
  const [copied, setCopied] = useState(false);

  // Fetch FHIR bundle and trigger CDS hook when persona or patient changes
  useEffect(() => {
    let isMounted = true;
    const fetchBundle = async () => {
      try {
        const personaKey = selectedPersonaId || 'PERSONA-1';
        const res = await fetch(`${apiBase}/api/fhir/sample-bundle/${personaKey}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setFhirBundle(data);
        }
      } catch (err) {
        console.error('Failed to fetch FHIR bundle:', err);
      }
    };
    fetchBundle();
    return () => { isMounted = false; };
  }, [selectedPersonaId, apiBase]);

  // Trigger CDS Hook
  const triggerHook = async () => {
    setLoadingHook(true);
    try {
      const res = await fetch(`${apiBase}/cds-services/vitarisk-ckm-advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook: 'patient-view',
          hookInstance: `hook-${Date.now()}`,
          context: {
            patientId: selectedPersonaId || 'PERSONA-1',
            userId: 'Practitioner/dr-elena-rostova'
          },
          prefetch: {
            observations: fhirBundle
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCdsResponse(data);
      }
    } catch (err) {
      console.error('Failed to trigger CDS Hook:', err);
    } finally {
      setLoadingHook(false);
    }
  };

  // Automatically trigger on mount or bundle change
  useEffect(() => {
    if (fhirBundle) {
      triggerHook();
    }
  }, [fhirBundle]);

  const copyJson = (obj) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baselines = prediction?.clinical_baselines;
  const fairnessDecision = prediction?.fairness_calibrated_decision;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                HL7 FHIR R4 & CDS Hooks 1.0 Clinical Interoperability
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                EHR-Native Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Eliminating "blank-form fatigue." VitaRisk runs natively inside electronic health records (Epic, Cerner, Oracle Health) via standard HL7 CDS Hooks (<code className="text-indigo-300">patient-view</code> & <code className="text-indigo-300">order-select</code>), listening to LOINC lab streams without requiring clinician data re-entry.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={triggerHook}
              disabled={loadingHook}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${loadingHook ? 'animate-spin' : ''}`} />
              <span>{loadingHook ? 'Invoking Hook...' : 'Simulate EHR Trigger'}</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex space-x-2 mt-6 pt-4 border-t border-slate-800/80 text-xs">
          {[
            { id: 'cards', label: `CDS Hook Cards (${cdsResponse?.cards?.length || 0})` },
            { id: 'baselines', label: 'Siloed vs Unified CKM Baselines' },
            { id: 'fairness', label: 'Operational Fairness Decision' },
            { id: 'fhir', label: 'HL7 FHIR R4 Bundle (JSON)' },
            { id: 'raw_hook', label: 'Raw CDS Hook Response' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === tab.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: CDS HOOK CARDS */}
      {activeSubTab === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Simulated EHR Alert Stream (Epic Hyperspace / Cerner PowerChart Sidebar)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Hook: patient-view • Response Time: &lt;15ms
            </span>
          </div>

          {loadingHook ? (
            <div className="p-12 text-center text-xs font-mono text-slate-400">
              Evaluating patient-view hook in real-time...
            </div>
          ) : cdsResponse?.cards?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cdsResponse.cards.map((card, idx) => {
                const isCritical = card.indicator === 'critical';
                const isWarning = card.indicator === 'warning';
                const borderColor = isCritical ? 'border-red-500/50 bg-red-950/20' : isWarning ? 'border-amber-500/50 bg-amber-950/20' : 'border-sky-500/50 bg-sky-950/20';
                const badgeColor = isCritical ? 'bg-red-500/20 text-red-300 border-red-500/40' : isWarning ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-sky-500/20 text-sky-300 border-sky-500/40';

                return (
                  <div key={card.uuid || idx} className={`border rounded-2xl p-5 shadow-xl space-y-3 ${borderColor}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                          {card.indicator} Indicator
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {card.summary}
                        </h4>
                      </div>
                      {isCritical ? (
                        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                      ) : (
                        <Info className="w-5 h-5 text-amber-400 shrink-0" />
                      )}
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 font-sans">
                      {card.detail}
                    </div>

                    {/* Suggestions with FHIR actions */}
                    {card.suggestions && card.suggestions.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          EHR 1-Click Actionable Order:
                        </span>
                        {card.suggestions.map((sug, sIdx) => (
                          <div key={sIdx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                            <div className="text-xs text-teal-300 font-medium">
                              {sug.label}
                            </div>
                            <button
                              onClick={() => alert(`FHIR MedicationRequest created successfully: ${sug.actions?.[0]?.description || 'Order placed'}`)}
                              className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap"
                            >
                              Sign Order
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60">
                      <span>Source: <a href={card.source?.url} target="_blank" rel="noreferrer" className="text-indigo-400 underline">{card.source?.label}</a></span>
                      {card.links && card.links.length > 0 && (
                        <span className="text-teal-400 flex items-center space-x-1">
                          <span>SMART App Enabled</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No active alerts. Patient biomarkers within normal ranges.
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SILOED VS UNIFIED BASELINES */}
      {activeSubTab === 'baselines' && (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <span>Head-to-Head: Traditional Siloed Calculators vs. VitaRisk CKM Cascade</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Comparing published clinical algorithms (Tangri KFRE 4-Var for Kidney Failure & AHA PREVENT 2024 for CVD) against VitaRisk's joint multi-organ intelligence.
              </p>
            </div>
            <span className="text-[11px] font-mono text-teal-300 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
              AHA PREVENT™ • Tangri KFRE
            </span>
          </div>

          {baselines ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-slate-400">Tangri KFRE (5-Yr Kidney Failure)</span>
                  <div className="text-2xl font-bold text-slate-200">{baselines.kfre_5yr_kidney_failure_pct}%</div>
                  <span className="text-[10px] text-amber-400">Ignores HbA1c & CVD cross-talk</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-slate-400">VitaRisk CKD Progression (5-Yr)</span>
                  <div className="text-2xl font-bold text-sky-400">{baselines.vitarisk_5yr_ckd_pct}%</div>
                  <span className="text-[10px] text-teal-400">Coupled with Diabetic Microvascular Damage</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-slate-400">AHA PREVENT (5-Yr Total CVD)</span>
                  <div className="text-2xl font-bold text-slate-200">{baselines.aha_prevent_5yr_cvd_pct}%</div>
                  <span className="text-[10px] text-amber-400">Siloed cardiac focus</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[11px] text-slate-400">VitaRisk Joint Multimorbidity</span>
                  <div className="text-2xl font-bold text-purple-400">{baselines.vitarisk_5yr_multimorbidity_pct}%</div>
                  <span className="text-[10px] text-purple-300">≥2 Chronic Diseases Risk</span>
                </div>
              </div>

              {/* Clinical Blindspots Eliminated */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-teal-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Clinical Blindspots Eliminated by VitaRisk:</span>
                </h4>
                <ul className="space-y-2">
                  {baselines.clinical_blindspots_eliminated?.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                      <ArrowRight className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">Loading clinical baselines...</div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: OPERATIONAL FAIRNESS DECISIONS */}
      {activeSubTab === 'fairness' && (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-teal-400" />
                <span>Operationalized Algorithmic Fairness Mitigation (FM-08)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Subgroup threshold calibration (τ_g) actively applied during clinical decision scoring to eliminate disparate false negatives across protected demographics.
              </p>
            </div>
            <span className="text-[11px] font-mono text-teal-300 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
              Active Equal Opportunity
            </span>
          </div>

          {fairnessDecision ? (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                <div><span className="text-slate-400">Biological Sex:</span> <strong className="text-white">{fairnessDecision.demographics?.sex}</strong></div>
                <div><span className="text-slate-400">Age Bracket:</span> <strong className="text-white">{fairnessDecision.demographics?.age_group}</strong></div>
                <div><span className="text-slate-400">SES Quartile:</span> <strong className="text-white">{fairnessDecision.demographics?.ses_group}</strong></div>
              </div>

              {/* Table of Decisions */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Chronic Endpoint</th>
                      <th className="py-2.5 px-4 font-semibold">Predicted Risk</th>
                      <th className="py-2.5 px-4 font-semibold">Standard Threshold</th>
                      <th className="py-2.5 px-4 font-semibold">Subgroup Threshold (τ_g)</th>
                      <th className="py-2.5 px-4 font-semibold">Decision Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {Object.entries(fairnessDecision.decisions || {}).map(([key, val]) => (
                      <tr key={key} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-bold text-white uppercase">{key}</td>
                        <td className="py-2.5 px-4 text-slate-200">{(val.predicted_probability * 100).toFixed(1)}%</td>
                        <td className="py-2.5 px-4 text-slate-400">{(val.global_threshold * 100).toFixed(0)}%</td>
                        <td className="py-2.5 px-4 text-teal-300 font-bold">{(val.subgroup_threshold * 100).toFixed(1)}%</td>
                        <td className="py-2.5 px-4">
                          {val.early_interception_activated ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                              ⚡ EARLY INTERCEPTION (Fairness Activated)
                            </span>
                          ) : val.flagged_calibrated ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              FLAGGED (High Risk)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                              SURVEILLANCE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {fairnessDecision.early_interceptions?.length > 0 && (
                <div className="bg-teal-950/30 border border-teal-500/40 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-teal-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span>Algorithmic Justice Impact:</span>
                  </h4>
                  {fairnessDecision.early_interceptions.map((a, i) => (
                    <p key={i} className="text-xs text-slate-300">
                      {a.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">Loading fairness metrics...</div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: HL7 FHIR R4 BUNDLE VIEWER */}
      {activeSubTab === 'fhir' && (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>HL7 FHIR R4 Patient Bundle Resource ({selectedPersonaId})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Authentic FHIR R4 collection bundle containing Patient demographics and standard LOINC laboratory observations.
              </p>
            </div>
            <button
              onClick={() => copyJson(fhirBundle)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy FHIR JSON'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-[500px]">
            {JSON.stringify(fhirBundle, null, 2)}
          </pre>
        </div>
      )}

      {/* SUB-TAB 5: RAW CDS HOOK RESPONSE */}
      {activeSubTab === 'raw_hook' && (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Raw HL7 CDS Hooks 1.0 Response Payload</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Standard JSON response returned by <code className="text-emerald-300">POST /cds-services/vitarisk-ckm-advisor</code>.
              </p>
            </div>
            <button
              onClick={() => copyJson(cdsResponse)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Response JSON'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[500px]">
            {JSON.stringify(cdsResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './EditorTabs.css';

/**
 * PUBLIC_INTERFACE
 * EditorTabs
 * Tabbed editors for HTML, CSS, and JS.
 * - Provides tabs, keyboard navigation, and accessible controls.
 * - Supports auto-run debounce and Run button via callbacks.
 */
function EditorTabs({
  htmlValue,
  cssValue,
  jsValue,
  onHtmlChange,
  onCssChange,
  onJsChange,
  onRun,
  autoRun,
  setAutoRun,
  debounceMs = 700,
}) {
  const [activeTab, setActiveTab] = useState('html');
  const tabs = useMemo(
    () => [
      { id: 'html', label: 'HTML' },
      { id: 'css', label: 'CSS' },
      { id: 'js', label: 'JS' },
    ],
    []
  );

  const textareaRefs = {
    html: useRef(null),
    css: useRef(null),
    js: useRef(null),
  };

  // Keyboard navigation for tabs (ArrowLeft/Right, Home/End)
  const onTabsKeyDown = (e) => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    if (currentIndex < 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[next].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prev].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(tabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(tabs[tabs.length - 1].id);
    }
  };

  // Auto-run debounce
  useEffect(() => {
    if (!autoRun) return;
    const id = setTimeout(() => {
      if (typeof onRun === 'function') onRun();
    }, debounceMs);
    return () => clearTimeout(id);
  }, [htmlValue, cssValue, jsValue, autoRun, debounceMs, onRun]);

  // Ctrl/Cmd+Enter to run inside active editor
  useEffect(() => {
    const el = textareaRefs[activeTab]?.current;
    if (!el) return;
    const handler = (e) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        if (typeof onRun === 'function') onRun();
      }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [activeTab, onRun]);

  const renderEditor = (id, label, value, onChange) => {
    const lines = String(value ?? '').split('\n').length;
    const lineNos = Array.from({ length: lines }, (_, i) => String(i + 1)).join('\n');

    return (
      <div
        role="tabpanel"
        id={`tab-panel-${id}`}
        aria-labelledby={`tab-${id}`}
        hidden={activeTab !== id}
        className="tab-panel"
      >
        <div className="editor-wrapper">
          <pre className="editor-linenos" aria-hidden="true">{lineNos}</pre>
          <textarea
            ref={textareaRefs[id]}
            className="editor-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} editor`}
            spellCheck={false}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="editor-tabs-root">
      <div className="pane-header tabs-header">
        <div className="tabs-group" role="tablist" aria-label="HTML/CSS/JS editors" onKeyDown={onTabsKeyDown}>
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              aria-selected={activeTab === t.id}
              aria-controls={`tab-panel-${t.id}`}
              className={`tab ${activeTab === t.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="controls">
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
              aria-label="Toggle Auto-Run"
            />
            <span>Auto-Run</span>
          </label>
          <button className="btn btn-secondary" onClick={() => {
            // Clear current tab editor content quickly
            if (activeTab === 'html') onHtmlChange('');
            if (activeTab === 'css') onCssChange('');
            if (activeTab === 'js') onJsChange('');
          }}>
            Clear Tab
          </button>
          <button className="btn btn-primary" onClick={onRun} aria-label="Run code (Ctrl/Cmd+Enter)">
            Run / Preview
          </button>
        </div>
      </div>

      {renderEditor('html', 'HTML', htmlValue, onHtmlChange)}
      {renderEditor('css', 'CSS', cssValue, onCssChange)}
      {renderEditor('js', 'JS', jsValue, onJsChange)}
      <div className="hint">Use Ctrl/Cmd + Enter to Run. Auto-Run triggers after a short pause.</div>
    </div>
  );
}

EditorTabs.propTypes = {
  htmlValue: PropTypes.string.isRequired,
  cssValue: PropTypes.string.isRequired,
  jsValue: PropTypes.string.isRequired,
  onHtmlChange: PropTypes.func.isRequired,
  onCssChange: PropTypes.func.isRequired,
  onJsChange: PropTypes.func.isRequired,
  onRun: PropTypes.func.isRequired,
  autoRun: PropTypes.bool.isRequired,
  setAutoRun: PropTypes.func.isRequired,
  debounceMs: PropTypes.number,
};

export default EditorTabs;

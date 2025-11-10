import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * PUBLIC_INTERFACE
 * CodeEditor
 * A lightweight textarea-based editor with optional CSS-based line numbers.
 * Supports Ctrl/Cmd+Enter to run via onRun callback.
 */
function CodeEditor({ value, onChange, onRun }) {
  const textareaRef = useRef(null);

  // Generate simple line numbers based on content lines
  const lineNumbers = useMemo(() => {
    const lines = String(value ?? '').split('\n').length;
    return Array.from({ length: lines }, (_, i) => String(i + 1)).join('\n');
  }, [value]);

  useEffect(() => {
    const el = textareaRef.current;
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
  }, [onRun]);

  return (
    <div className="editor-wrapper">
      <pre className="editor-linenos" aria-hidden="true">{lineNumbers}</pre>
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Code editor"
        spellCheck={false}
      />
    </div>
  );
}

CodeEditor.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onRun: PropTypes.func
};

export default CodeEditor;

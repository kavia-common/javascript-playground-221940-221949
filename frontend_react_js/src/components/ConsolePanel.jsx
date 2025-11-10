import React from 'react';
import PropTypes from 'prop-types';

/**
 * PUBLIC_INTERFACE
 * ConsolePanel
 * Shows console output lines with type, timestamp, and message. Provides clear button.
 */
function ConsolePanel({ messages, onClear }) {
  return (
    <div className="output-pane">
      <div className="pane-header">
        <h2>Console</h2>
        <div className="controls">
          <button className="btn btn-secondary" onClick={onClear} aria-label="Clear console">
            Clear
          </button>
        </div>
      </div>
      <div className="console" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="console-entry">
            <span className="badge badge-status">status</span>
            <div className="console-text">No console output yet. Logs and errors will appear here.</div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const badgeClass = `badge badge-${m.type || 'log'}`;
            let timeText = '';
            try {
              timeText = m.time ? new Date(m.time).toLocaleTimeString() : '';
            } catch {
              timeText = '';
            }
            return (
              <div className="console-entry" key={`${m.type}-${idx}-${m.time || ''}`}>
                <span className={badgeClass}>{m.type || 'log'}</span>
                <div className="console-text" style={{ color: m.type === 'error' ? 'var(--color-error)' : undefined }}>
                  {String(m.text ?? '')}
                </div>
                <div className="console-time">{timeText}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

ConsolePanel.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(['log', 'warn', 'error', 'status']),
    text: PropTypes.any,
    time: PropTypes.string
  })).isRequired,
  onClear: PropTypes.func.isRequired
};

export default ConsolePanel;

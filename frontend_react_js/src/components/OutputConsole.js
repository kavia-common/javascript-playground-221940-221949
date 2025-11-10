import React from 'react';
import PropTypes from 'prop-types';

/**
 * PUBLIC_INTERFACE
 * OutputConsole
 * Renders a list of console messages with type badge and timestamp.
 * Message structure: { type: 'log'|'warn'|'error'|'status', text: string, time: ISOString }
 */
function OutputConsole({ messages }) {
  return (
    <div className="console" role="log" aria-live="polite">
      {messages.length === 0 ? (
        <div className="console-entry">
          <span className="badge badge-status">status</span>
          <div className="console-text">No output yet. Run your code to see results here.</div>
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
              <div className="console-text">{String(m.text ?? '')}</div>
              <div className="console-time">{timeText}</div>
            </div>
          );
        })
      )}
    </div>
  );
}

OutputConsole.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(['log', 'warn', 'error', 'status']),
    text: PropTypes.any,
    time: PropTypes.string
  })).isRequired
};

export default OutputConsole;

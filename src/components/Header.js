import React from 'react';
import './Header.css';

function Header({ providerName }) {
  return (
    <div className="chat-header">
      <div className="logo-area">
        <div className="logo-icon">SP</div>
        <div className="logo-text">
          <h1>SUCCESS POLARIS</h1>
          <p>▸ ASTRA POLARIS ACADEMY ◂</p>
        </div>
      </div>
      <div className="ai-identity">
        <div className="ai-name">✦ ASTARTÉ ✦</div>
        <div className="ai-title">
          Intelligence Artificielle Éducative
          {providerName && <span className="provider-badge"> · {providerName}</span>}
        </div>
      </div>
    </div>
  );
}

export default Header;

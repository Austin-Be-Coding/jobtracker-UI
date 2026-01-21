import React from 'react'
import CreateUser from '../User/CreateUser'
import boots from '../assets/images/Boots_With_Text.png'
import '../styles/main.css'

export default function HomePage({ onUserCreated } = {}) {
  function goCreate() {
    window.location.hash = '#create'
  }

  return (
    <div style={{ margin: '2rem auto', padding: 20, maxWidth: 430, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 196, height: 196, borderRadius: '0%', overflow: 'hidden', background: 'transparent', marginBottom: -10 }}>
            <img src={boots} alt="Boots" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </header>

      <section style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={goCreate} className="cta-button" >Advance Your Career</button>
            <a href="#signin" className="cta-link">Sign in</a>
          </div>
        </div>


      </section>
    </div>
  )
}
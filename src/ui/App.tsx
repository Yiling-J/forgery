import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Characters from './pages/Characters'
import Equipments from './pages/Equipments'
import FittingRoom from './pages/FittingRoom'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/characters" replace />} />
          <Route path="characters" element={<Characters />} />
          <Route path="characters/:id/outfits" element={<FittingRoom />} />
          <Route path="equipments" element={<Equipments />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

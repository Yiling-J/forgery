import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Characters from './pages/Characters'
import Equipments from './pages/Equipments'
import FittingRoom from './pages/FittingRoom'
import Poses from './pages/Poses'
import Expressions from './pages/Expressions'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/characters" replace />} />
          <Route path="characters" element={<Characters />} />
          <Route path="characters/:id/looks" element={<FittingRoom />} />
          <Route path="equipments" element={<Equipments />} />
          <Route path="poses" element={<Poses />} />
          <Route path="expressions" element={<Expressions />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

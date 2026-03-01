import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import ProjectList from './pages/ProjectList'
import Characters from './pages/Characters'
import Equipments from './pages/Equipments'
import DataDetailPage from './pages/DataDetailPage'
import Poses from './pages/Poses'
import Expressions from './pages/Expressions'
import Categories from './pages/Categories'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProjectList />} />
          <Route path="projects/:projectId/characters" element={<Characters />} />
          <Route path="projects/:projectId/data/:id" element={<DataDetailPage />} />
          <Route path="projects/:projectId/equipments" element={<Equipments />} />
          <Route path="projects/:projectId/poses" element={<Poses />} />
          <Route path="projects/:projectId/expressions" element={<Expressions />} />
          <Route path="projects/:projectId/categories" element={<Categories />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

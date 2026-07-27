import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { useFamilyTree } from './hooks/useFamilyTree.js';
import { FamilyTreeProvider } from './context/FamilyTreeContext.jsx';
import { ToastProvider } from './components/common/Toast.jsx';
import Loader from './components/common/Loader.jsx';
import Navbar from './components/common/Navbar.jsx';
import TreeCanvas from './components/tree/TreeCanvas.jsx';
import HomePage from './pages/HomePage.jsx';
import AddPersonPage from './pages/AddPersonPage.jsx';
import EditPersonPage from './pages/EditPersonPage.jsx';
import ErrorPage from './pages/ErrorPage.jsx';
import HowToPage from './pages/HowToPage.jsx';

const RECENT_KEY = 'family-tree-recent-id';

/** Reads :familyId from the URL and focuses a person if :personId is present. */
function TreeView() {
  const { personId } = useParams();
  const { focusPerson, clearFocus } = useFamilyTree();

  useEffect(() => {
    if (personId) focusPerson(personId);
    else clearFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  return <TreeCanvas />;
}

/** Everything under /tree/:familyId shares one live FamilyTreeProvider. */
function FamilyTreeSection() {
  const { familyId } = useParams();
  const { loading, notFound } = useFamilyTreeInner();

  useEffect(() => {
    if (familyId) window.localStorage.setItem(RECENT_KEY, familyId);
  }, [familyId]);

  if (loading) return <Loader />;
  if (notFound) return <ErrorPage />;

  return (
    <>
      <Navbar />
      <Routes>
        <Route index element={<TreeView />} />
        <Route path="person/:personId" element={<TreeView />} />
        <Route path="add" element={<AddPersonPage />} />
        <Route path="person/:personId/edit" element={<EditPersonPage />} />
      </Routes>
    </>
  );
}

// Small helper so FamilyTreeSection can read provider state before its own
// children mount (loading/notFound gates rendering of Navbar + routes).
function useFamilyTreeInner() {
  return useFamilyTree();
}

function FamilyTreeRoute() {
  const { familyId } = useParams();
  return (
    <FamilyTreeProvider familyId={familyId}>
      <FamilyTreeSection />
    </FamilyTreeProvider>
  );
}

export default function App() {
  useAuth(); // ensures auth state is resolved before deep routes render

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-to" element={<HowToPage />} />
        <Route path="/tree/:familyId/*" element={<FamilyTreeRoute />} />
        <Route path="/404" element={<ErrorPage message="Page not found." />} />
        <Route
          path="*"
          element={<Navigate to="/404" replace />}
        />
      </Routes>
    </ToastProvider>
  );
}

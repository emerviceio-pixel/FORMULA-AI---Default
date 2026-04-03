import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navigation/Navbar';
import { useAuth } from '../../contexts/AuthContext';

const Layout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {isAuthenticated && (
        <>
          <Navbar />
        </>
      )}
      <main className={isAuthenticated ? 'pb-16 md:pb-0' : ''}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
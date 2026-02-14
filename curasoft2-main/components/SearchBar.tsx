import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';

interface SearchBarProps {
  navItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ isActive: boolean }>;
    permission: string | null;
    adminOnly: boolean;
  }>;
  currentView: View;
  setCurrentView: (view: View) => void;
  isCollapsed: boolean;
  onClose?: () => void; // For mobile drawer
}

const SearchBar: React.FC<SearchBarProps> = ({
  navItems,
  currentView,
  setCurrentView,
  isCollapsed,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(navItems);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(navItems);
    } else {
      const filtered = navItems.filter(item =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
    setSelectedIndex(-1);
  }, [searchTerm, navItems]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
            handleItemSelect(filteredItems[selectedIndex].id as View);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemSelect = (viewId: View) => {
    setCurrentView(viewId);
    setIsOpen(false);
    setSearchTerm('');
    if (onClose) onClose(); // Close mobile drawer if open
  };

  const toggleSearch = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
    }
  };

  if (isCollapsed) {
    return (
      <div ref={containerRef} className="relative mb-4">
        <button
          onClick={toggleSearch}
          className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200/50 dark:hover:from-purple-800/40 dark:hover:to-purple-700/30 transition-all duration-300 group border border-purple-200/50 dark:border-purple-700/50 shadow-sm hover:shadow-md"
          aria-label="Search navigation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-64 overflow-y-auto">
            <div className="p-3">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              />
            </div>
            {filteredItems.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                {filteredItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item.id as View)}
                      className={`w-full px-3 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-150 flex items-center gap-3 ${
                        index === selectedIndex ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                      }`}
                    >
                      <IconComponent isActive={false} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative mb-6">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search navigation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full px-4 py-3 pl-12 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-700 dark:to-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-150"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && searchTerm && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-64 overflow-y-auto">
          {filteredItems.length > 0 ? (
            <div className="max-h-48 overflow-y-auto">
              {filteredItems.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item.id as View)}
                    className={`w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-150 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
                      index === selectedIndex ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    } ${isActive ? 'bg-purple-100/50 dark:bg-purple-800/30' : ''}`}
                  >
                    <IconComponent isActive={isActive} />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
              No results found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

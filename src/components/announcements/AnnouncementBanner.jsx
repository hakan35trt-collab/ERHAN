
import React, { useState, useEffect, useRef } from "react";
import { Announcement } from "@/entities/Announcement";
import { X, Pin, ChevronLeft, ChevronRight, Megaphone } from "lucide-react"; // Added Megaphone
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLocation } from 'react-router-dom'; // Added useLocation

export default function AnnouncementBanner({ currentPageName }) {
  const [scrollingAnnouncements, setScrollingAnnouncements] = useState([]); // Renamed from announcements
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState([]);
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);
  const [currentScrollingIndex, setCurrentScrollingIndex] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [visible, setVisible] = useState(true); // Added visible state
  const [showPinned, setShowPinned] = useState(true); // Added showPinned state
  const intervalRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  const location = useLocation(); // Added useLocation hook

  // Pages where the announcement banner should not be displayed
  const excludedPages = ["Login", "Profile", "Points", "Announcement", "Notes"];

  useEffect(() => {
    // If the current page is in the excluded list, hide the banner and stop intervals
    if (excludedPages.includes(currentPageName)) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
      setScrollingAnnouncements([]); // Clear existing announcements
      setPinnedAnnouncements([]);
      setVisible(false); // Hide the entire banner
      return; // Do not proceed with loading announcements or setting intervals
    }

    setVisible(true); // Ensure banner is visible for non-excluded pages

    loadAnnouncements();
    // Refresh announcements every 5 minutes (300000 ms)
    const interval = setInterval(loadAnnouncements, 300000); 
    return () => {
      // Cleanup interval on component unmount or currentPageName change
      clearInterval(interval);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [currentPageName]); // Dependency on currentPageName

  // Auto-slide effect for pinned announcements
  useEffect(() => {
    if (pinnedAnnouncements.length > 1 && isAutoSliding) {
      intervalRef.current = setInterval(() => {
        setCurrentPinnedIndex(prev => (prev + 1) % pinnedAnnouncements.length);
      }, 30000); // Change pinned announcement every 30 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [pinnedAnnouncements.length, isAutoSliding]);

  // Sequential scrolling for announcements
  useEffect(() => {
    if (scrollingAnnouncements.length > 0) { // Changed from announcements.length
      // 25 saniye animasyon + 1 saniye geçiş = 26 saniye total
      const totalTimePerAnnouncement = 26000;
      scrollIntervalRef.current = setInterval(() => {
        setCurrentScrollingIndex(prev => (prev + 1) % scrollingAnnouncements.length); // Changed from announcements.length
      }, totalTimePerAnnouncement);

      return () => {
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
        }
      };
    }
  }, [scrollingAnnouncements.length]); // Changed from announcements.length
  
  const loadAnnouncements = async () => {
    try {
      const now = new Date().toISOString();
      const activeAnnouncements = await Announcement.filter({
        expires_at: { $gt: now },
        is_active: true
      }, '-created_date');

      const filteredAnnouncements = activeAnnouncements.filter(ann => {
        if (!ann.target_pages || ann.target_pages.length === 0) return true;
        return ann.target_pages.includes(currentPageName);
      });

      const scrolling = filteredAnnouncements.filter(ann => ann.announcement_type === 'scrolling');
      const pinned = filteredAnnouncements.filter(ann => ann.announcement_type === 'pinned');

      setScrollingAnnouncements(scrolling); // Changed setAnnouncements
      setPinnedAnnouncements(pinned);
      
      // Reset indices if current index is out of bounds after new load
      if (pinned.length > 0 && currentPinnedIndex >= pinned.length) {
        setCurrentPinnedIndex(0);
      }
      if (scrolling.length > 0 && currentScrollingIndex >= scrolling.length) { // Changed scrollingAnnouncements.length
        setCurrentScrollingIndex(0);
      }
    } catch (error) {
      console.error("Duyurular yüklenemedi:", error);
    }
  };

  const nextPinned = () => {
    setCurrentPinnedIndex(prev => (prev + 1) % pinnedAnnouncements.length);
    setIsAutoSliding(false);
    setTimeout(() => setIsAutoSliding(true), 10000); // Re-enable auto-slide after 10 seconds
  };

  const prevPinned = () => {
    setCurrentPinnedIndex(prev => (prev - 1 + pinnedAnnouncements.length) % pinnedAnnouncements.length);
    setIsAutoSliding(false);
    setTimeout(() => setIsAutoSliding(true), 10000); // Re-enable auto-slide after 10 seconds
  };

  const goToPinned = (index) => {
    setCurrentPinnedIndex(index);
    setIsAutoSliding(false);
    setTimeout(() => setIsAutoSliding(true), 10000); // Re-enable auto-slide after 10 seconds
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > 50; // Swipe left threshold
    const isRightSwipe = distance < -50; // Swipe right threshold

    if (isLeftSwipe && pinnedAnnouncements.length > 1) {
      nextPinned();
    }
    if (isRightSwipe && pinnedAnnouncements.length > 1) {
      prevPinned();
    }

    // Reset touch refs
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const ScrollingAnnouncements = ({ announcements }) => {
    if (announcements.length === 0) return null;

    const currentAnnouncement = announcements[currentScrollingIndex];
    if (!currentAnnouncement) return null; // Should not happen if announcements.length > 0

    return (
      <div className="relative bg-gradient-to-r from-gray-900 via-black to-gray-900 text-yellow-400 rounded-lg shadow-2xl border border-yellow-600 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-black text-center py-1">
          <span className="text-sm font-bold">📢 DUYURU</span>
        </div>
        
        <div className="relative h-7 flex items-center overflow-hidden">
          <div 
            key={currentScrollingIndex}
            className="scrolling-text absolute whitespace-nowrap text-lg font-semibold"
            style={{
              animationName: 'scrollText',
              animationDuration: '25s',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationFillMode: 'none'
            }}
          >
            {currentAnnouncement.content}
          </div>
        </div>

        <style jsx>{`
          @keyframes scrollText {
            0% {
              transform: translateX(100vw); /* Start from right, off-screen */
            }
            100% {
              transform: translateX(-100%); /* End left, off-screen */
            }
          }
          .scrolling-text {
            animation-play-state: running;
          }
        `}</style>
      </div>
    );
  };

  const PinnedAnnouncementCarousel = ({ announcements }) => {
    if (!announcements || announcements.length === 0) return null;

    const currentAnnouncement = announcements[currentPinnedIndex];

    return (
      <div className="relative bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border border-yellow-500/40 rounded-lg shadow-lg overflow-hidden">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 py-1.5 flex items-center justify-between flex-wrap gap-x-3 gap-y-1">
          <div className="flex items-center space-x-2">
            <Pin className="w-3 h-3 text-black" />
            <span className="text-black font-bold text-xs">
              {currentAnnouncement.title || "SABİTLENMİŞ DUYURU"}
            </span>
            {announcements.length > 1 && (
              <span className="text-black text-xs opacity-70">
                {currentPinnedIndex + 1}/{announcements.length}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-black text-xs opacity-80">
              {currentAnnouncement.created_by_name}
            </span>
            <span className="text-black text-xs opacity-60">
              {format(new Date(currentAnnouncement.created_date), 'dd.MM')}
            </span>
          </div>
        </div>
        
        {/* Carousel Content */}
        <div 
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentPinnedIndex * 100}%)` }}
          >
            {announcements.map((announcement, index) => (
              <div key={announcement.id} className="w-full flex-shrink-0">
                <div className="px-3 py-2 bg-gradient-to-r from-gray-800/80 to-gray-900/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-yellow-300 text-sm leading-relaxed mb-1.5">
                        {announcement.content}
                      </p>
      
                      {(announcement.company || announcement.plate) && (
                        <div className="flex items-center space-x-2 text-xs text-yellow-500">
                          {announcement.company && (
                            <span className="truncate">🏢 {announcement.company}</span>
                          )}
                          {announcement.plate && (
                            <span className="bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                              🚗 {announcement.plate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Navigation buttons for desktop/non-touch */}
                    {announcements.length > 1 && (
                      <div className="flex items-center space-x-0.5">
                        <Button
                          onClick={prevPinned}
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300 rounded-full"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={nextPinned}
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300 rounded-full"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        {announcements.length > 1 && (
          <div className="flex items-center justify-center space-x-1.5 pb-1.5 pt-0.5 bg-gradient-to-r from-gray-800 to-gray-900">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={() => goToPinned(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentPinnedIndex 
                    ? 'bg-yellow-400 w-4' 
                    : 'bg-yellow-600/50 hover:bg-yellow-600/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    visible && ( // Conditional rendering based on visible state
      <div className="w-full">
        <div className="space-y-0">
          {scrollingAnnouncements.length > 0 && <ScrollingAnnouncements announcements={scrollingAnnouncements} />} {/* Changed announcements */}
          {showPinned && pinnedAnnouncements.length > 0 && <PinnedAnnouncementCarousel announcements={pinnedAnnouncements} />}
        </div>
      </div>
    )
  );
}

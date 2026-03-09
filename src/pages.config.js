/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminSettings from './pages/AdminSettings';
import Announcement from './pages/Announcement';
import Backup from './pages/Backup';
import BadgeManagement from './pages/BadgeManagement';
import Dashboard from './pages/Dashboard';
import GetAuthorization from './pages/GetAuthorization';
import Home from './pages/Home';
import InsideVisitors from './pages/InsideVisitors';
import LogPanel from './pages/LogPanel';
import NoAccess from './pages/NoAccess';
import Notes from './pages/Notes';
import Points from './pages/Points';
import Profile from './pages/Profile';
import ShiftManagement from './pages/ShiftManagement';
import StaffDirectory from './pages/StaffDirectory';
import UserManagement from './pages/UserManagement';
import VisitorAlert from './pages/VisitorAlert';
import VisitorList from './pages/VisitorList';
import VisitorRegistration from './pages/VisitorRegistration';
import VisitorSearch from './pages/VisitorSearch';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminSettings": AdminSettings,
    "Announcement": Announcement,
    "Backup": Backup,
    "BadgeManagement": BadgeManagement,
    "Dashboard": Dashboard,
    "GetAuthorization": GetAuthorization,
    "Home": Home,
    "InsideVisitors": InsideVisitors,
    "LogPanel": LogPanel,
    "NoAccess": NoAccess,
    "Notes": Notes,
    "Points": Points,
    "Profile": Profile,
    "ShiftManagement": ShiftManagement,
    "StaffDirectory": StaffDirectory,
    "UserManagement": UserManagement,
    "VisitorAlert": VisitorAlert,
    "VisitorList": VisitorList,
    "VisitorRegistration": VisitorRegistration,
    "VisitorSearch": VisitorSearch,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
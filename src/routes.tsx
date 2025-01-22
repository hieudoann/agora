import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import RoomPage from './pages/RoomPage/RoomPage';
// import VideoPage from './pages/Video/Video.pages';
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room" element={<RoomPage />} />
        {/* <Route path="/video" element={<VideoPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
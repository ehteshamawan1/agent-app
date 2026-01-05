import { Routes, Route } from 'react-router-dom';
import PoleList from './PoleList';
import PoleForm from './PoleForm';
import MapView from '../map/MapView';

const Poles = () => {
  return (
    <Routes>
      <Route index element={<PoleList />} />
      <Route path="create" element={<PoleForm />} />
      <Route path="edit/:id" element={<PoleForm />} />
      <Route path="map" element={<MapView />} />
    </Routes>
  );
};

export default Poles;

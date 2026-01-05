import { Routes, Route } from 'react-router-dom';
import ZoneList from './ZoneList';
import ZoneForm from './ZoneForm';
import ZoneDetail from './ZoneDetail';

const Zones = () => {
  return (
    <Routes>
      <Route index element={<ZoneList />} />
      <Route path="create" element={<ZoneForm />} />
      <Route path="edit/:id" element={<ZoneForm />} />
      <Route path="view/:id" element={<ZoneDetail />} />
    </Routes>
  );
};

export default Zones;

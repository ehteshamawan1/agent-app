import { Routes, Route } from 'react-router-dom';
import LandOwnerList from './LandOwnerList';
import LandOwnerForm from './LandOwnerForm';

const LandOwners = () => {
  return (
    <Routes>
      <Route index element={<LandOwnerList />} />
      <Route path="create" element={<LandOwnerForm />} />
      <Route path="edit/:id" element={<LandOwnerForm />} />
    </Routes>
  );
};

export default LandOwners;

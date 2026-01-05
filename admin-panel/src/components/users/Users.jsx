import { Routes, Route } from 'react-router-dom';
import UserList from './UserList';
import UserForm from './UserForm';

const Users = () => {
  return (
    <Routes>
      <Route index element={<UserList />} />
      <Route path="create" element={<UserForm />} />
      <Route path="edit/:id" element={<UserForm />} />
    </Routes>
  );
};

export default Users;

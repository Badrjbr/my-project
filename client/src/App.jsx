import "./App.css";
import { Routes, Route } from 'react-router-dom';
import Home from "./pages/Home/Home";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage/AuthPage";
;


const App = () => {
  return (
    <div className="app">
      <Layout>
        <Routes>
          <Route path="/login" element={<AuthPage/>} />
          <Route path="/" element={<Home/>} />
          <Route path="/shop" element={<div/>} />
          </Routes>
      </Layout>
    </div>
  );
};

export default App;


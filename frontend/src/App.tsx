import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Alerts from "./pages/Alerts";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Hosts from "./pages/Hosts";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="hosts" element={<Hosts />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="events" element={<Events />} />
      </Route>
    </Routes>
  );
}

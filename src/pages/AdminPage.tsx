import { useEffect, useState } from "react";

export default function AdminPage() {
  const [status] = useState("open");

  useEffect(() => {
    console.log("AdminPage cargado");
  }, []);

  return (
    <section style={{ padding: "2rem" }}>
      <h1>Panel de Admin</h1>
      <p>Estado actual: {status}</p>
    </section>
  );
}

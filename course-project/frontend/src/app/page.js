import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Welcome to CSC309 App</h1>
        <p>Select a section from the navigation.</p>
      </main>
    </div>
  );
}

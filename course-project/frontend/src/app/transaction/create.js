
import TaskCard from "../components/TaskCard";
import TransactionCard from "../components/TransactionCard";

export default function TransactionCreatePage() {
  let task = {};
  task.id = 1;
  return (
    <main>
      <h1>Create Transaction</h1>
      <TransactionCard task={task}/>
    </main>
  );
}

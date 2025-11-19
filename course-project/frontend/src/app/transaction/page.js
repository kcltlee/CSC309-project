'use client';
import TransactionCard from '../components/TransactionCard';
import TransactionFilter from '../components/TransactionFilter';

export default function TransactionsListPage() {

  // TODO: call api and implment infinite scroll
  return (
    <div className='main-container'>
      <h1>My Transactions</h1>
        <TransactionFilter/>
        <div className='infinite-scroll'>
          <TransactionCard id={1} remark="good deal" amount={20} type='purchase' promotionIds={1} spent={5} />
          <TransactionCard id={2} type='transfer' remark="pizza" amount={-15} utorid={'abcd123'} sender={'abcd123'} recipient={'plmn0987'} />
          <TransactionCard id={3} type='redemption' suspicious={true} amount={-20} redeemed={true}/>
          <TransactionCard id={4} type='adjustment' amount={5} relatedId={2}/>
          <TransactionCard id ={5} type='event' amount={10} relatedId={3}/>
          <TransactionCard id={1} remark="good deal" createdBy='joe999' amount={20} type='purchase' promotionIds={1} spent={5} />
          <TransactionCard id={2} type='transfer' remark="pizza" amount={-15} utorid={'abcd123'} sender={'abcd123'} recipient={'plmn0987'} />
          <TransactionCard id={3} type='redemption' suspicious={true} amount={-20} redeemed={true}/>
          <TransactionCard id={4} type='adjustment' amount={5} relatedId={2}/>
          <TransactionCard id ={5} type='event' amount={10} relatedId={3}/>
          <p>No more transactions.</p>
        </div>
        
    </div>
  );
}
// list all of the current user's transactions

// for managers, use tagselect to toggle between all transactions vs their transactions



    // const typeFields = {
    //     purchase: ["id", "utorid", "type", "remark", "createdBy", "amount", "spent", "promotionIds", "suspicious"],
    //     transfer: ["id", "type", "remark", "createdBy", "sender", "recipient", "amount"],
    //     redemption: ["id", "utorid", "type", "remark", "createdBy", "amount", "promotionIds", "relatedId", "redeemed"],
    //     adjustment: ["id", "utorid", "amount", "type", "relatedId", "promotionIds", "suspicious", "remark", "createdBy"],
    //     event: ["id", "recipient", "amount", "type", "eventId", "remark", "createdBy"]
    // };

  // for managers, just add a footer div with utorid | ... | Suspicious (if true)
  // only managers can see suspicious, and utorids who own transaction

  // user should see:
  // id               relatedValue (spent, utorid of other user, redeemed, transaction id, event)
  // type     amount
  // promotions
  //remark

  // managers only
  // utorid           Suspicious
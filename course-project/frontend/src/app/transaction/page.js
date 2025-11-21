'use client';
import { useState, useEffect } from 'react';
import TransactionCard from '../components/TransactionCard';
import TransactionFilter from '../components/TransactionFilter';
import styles from '@/app/transaction/transaction.module.css';


export default function TransactionsListPage() {

  const PAGELIMIT = 5;
  const [ transactions, setTransactions ] = useState([]);
  const [ filter, setFilter ] = useState({});
  const [ showAll, setShowAll ] = useState(false);
  const [ page, setPage ] = useState(1);
  const [ end, setEnd ] = useState(false);
  const [ loading, setLoading ] = useState(false);
  const backendURL = 'http://localhost:4000';

  // create a context for filters, provide it transactionFilter to set filters

  const loadRegular = async () => {
    const url = new URL(backendURL + '/users/me/transactions');

    const allowedKeys = ['type', 'relatedId', 'promotionId', 'amount', 'operator', 'pagination', 'limit'];
    const relevantFilters = Object.fromEntries(Object.entries(filter).filter(([k, v]) => {
      return allowedKeys.includes(k) && v !== '';
    }));

    url.search = new URLSearchParams(relevantFilters).toString();

    fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => {return res.json()})
    .then(data => { loadData(data)});
  }

  const loadPrivileged = async () => {
    const url = new URL(backendURL + '/transactions');
  
    const allowedKeys = ['utorid', 'createdBy', 'suspicious',
            'promotionId', 'type', 'relatedId', 'amount', 'operator', 'page', 'limit'];
    const relevantFilters = Object.fromEntries(Object.entries(filter).filter(([k, v]) => {
      return allowedKeys.includes(k) && v !== '';
    }));

    url.search = new URLSearchParams(relevantFilters).toString();

    fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => {return res.json()})
    .then(data => { loadData(data)});
  }

  const loadData = (data) => {
    if (!data) {
      console.log('no data');
      return;
    }
    console.log(page);
    setLoading(true);
    const start = page === 1;
    if (start) {
        setTransactions(data.results);
    }
    else {
        setTransactions(prev => [...prev, ...data.results]);
    }

    // check if end of transactions reached
    if (!data || data.results.length < PAGELIMIT) {
      setEnd(true);
    }
    setLoading(false);

  }

  const load = (specificPage) => {
    filter.pagination = specificPage === 0 ? 1 : page;
    filter.limit = PAGELIMIT;

    let data;
    if (showAll) {
      data = loadPrivileged();
    }
    else {
      data = loadRegular();
    }
    setPage(prev => prev + 1);
  };


  // apply filter
  useEffect(()=>{
    setTransactions([]);
    setPage(0);
    load(1);
    setEnd(false);

  }, [filter]);

  const handleScroll = (e) => {
    const bottomReached = e.target.scrollHeight - e.target.scrollTop > e.target.clientHeight;
    if (bottomReached && !loading && !end) { 
      load();
    }
  }

  return (
    <div className='main-container'>
      <h1>My Transactions</h1>
        <TransactionFilter setFilter={setFilter} setShowAll={setShowAll}/>
        <div onScroll={handleScroll} className={styles.infiniteScroll}>
          {transactions.map((t, index) => {
            return <TransactionCard key={index} props={t}/>
          })}
          <p>No more transactions.</p>
        </div>
    </div>
  );

}

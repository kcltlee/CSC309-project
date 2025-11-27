'use client';
import { useState, useEffect, useRef } from 'react';
import TransactionCard from '../components/TransactionCard';
import TransactionFilter from '../components/TransactionFilter';
import styles from '@/app/transaction/transaction.module.css';
import { useAuth } from '@/context/AuthContext';


export default function TransactionsListPage() {

  const PAGELIMIT = 5;
  const { currentInterface } = useAuth();
  const [ transactions, setTransactions ] = useState([]);
  const [ filter, setFilter ] = useState({});
  const [ showAll, setShowAll ] = useState(false);
  const [ page, setPage ] = useState(1);
  const [ end, setEnd ] = useState(false);
  const [ loading, setLoading ] = useState(true);
  const [ errorMessage, setErrorMessage ] = useState('');
  const [ error, setError ] = useState(false);
  const scrollRef = useRef();
  const backendURL = 'http://localhost:4000';

  useEffect(() => {
    if (currentInterface) {
      setShowAll(currentInterface === 'manager' || currentInterface === 'superuser');
    }
  }, [currentInterface]);

  const loadRegular = async () => {
    const url = new URL(backendURL + '/users/me/transactions');

    const allowedKeys = ['type', 'id', 'relatedId', 'promotionId', 'amount', 'operator', 'page', 'limit'];
    const relevantFilters = Object.fromEntries(Object.entries(filter).filter(([k, v]) => {
      return allowedKeys.includes(k) && v !== '';
    }));

    url.search = new URLSearchParams(relevantFilters).toString();

    fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    })
    .then(response => {
      return response.json().then(result => {
        if (!response.ok) {
          throw new Error(result.error);
        }
        else {
          return result;
        }
    });
    })
    .then(data => { loadData(data)})
    .catch(err => {
      setErrorMessage(err.toString());
      setError(true);
    });
  }

  const loadPrivileged = async () => {
    const url = new URL(backendURL + '/transactions');
  
    const allowedKeys = ['utorid', 'id', 'createdBy', 'suspicious',
            'promotionId', 'type', 'relatedId', 'amount', 'operator', 'page', 'limit'];
    const relevantFilters = Object.fromEntries(Object.entries(filter).filter(([k, v]) => {
      return allowedKeys.includes(k) && v !== '';
    }));

    url.search = new URLSearchParams(relevantFilters).toString();

    fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
    })
    .then(response => {
      return response.json().then(result => {
        if (!response.ok) {
          throw new Error(result.error);
        }
        else {
          return result;
        }
    });
    })
    .then(data => { loadData(data)})
    .catch(err => {
      setErrorMessage(err.toString());
      setError(true);
    });
  }

  const loadData = (data) => {
    if (!data) {
      console.log('no data');
      return;
    }
    
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
    filter.page = specificPage === 1 ? 1 : page;
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
    setError(false);
    setErrorMessage('');

    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

  }, [filter, showAll]);

  const handleScroll = (e) => {
    const bottomReached = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 50;
    if (bottomReached && !loading && !end) { 
      load();
    }
  }

  return (
    <div className='main-container'>
      <h1>My Transactions</h1>
        <p className={'error ' + (error ? '' : styles.hidden)}>{errorMessage}</p>
        <TransactionFilter setFilter={setFilter} showAll={showAll}/>
       {!loading ? <div ref={scrollRef} onScroll={handleScroll} className={styles.infiniteScroll}>
          {transactions.map((t, index) => {
            return <TransactionCard key={index} {...t} showAll={showAll}/>
          })}
          <p>No more transactions.</p>
        </div> : <div className='spinner'></div>}
    </div>
  );

}

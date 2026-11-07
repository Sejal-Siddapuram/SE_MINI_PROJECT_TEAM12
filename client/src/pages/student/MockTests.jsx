import { useEffect, useState } from 'react';
import { getMockTests, getMockTest, submitMockTest, getMockAttempts, getInterviewContent } from '../../services/preparationApi';
import { getErrorMessage } from '../../services/api';
import Alert from '../../components/Alert';

export default function MockTests() {
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [interview, setInterview] = useState([]);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    Promise.all([getMockTests(), getMockAttempts(), getInterviewContent()])
      .then(([items, history, content]) => { setTests(items); setAttempts(history); setInterview(content); })
      .catch((err) => setError(getErrorMessage(err))).finally(() => setBusy(false));
  }, []);
  async function start(id) {
    setBusy(true); setError(''); setResult(null);
    try { const item = await getMockTest(id); setTest(item); setAnswers(item.questions.map(() => null)); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const saved = await submitMockTest(test.id, answers);
      setResult(saved); setTest(null);
      setAttempts((items) => [{ ...saved, testId: { title: test.title } }, ...items].slice(0, 50));
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }
  return <>
    <div className="page-header"><h1>Mock Aptitude Tests</h1></div>
    <Alert type="error">{error}</Alert>
    {busy && <p role="status">Please wait...</p>}
    {result && <Alert type="success">Score: {result.score}/{result.total} ({result.percentage}%)</Alert>}
    {test ? <form onSubmit={submit}>
      <h2>{test.title}</h2><p>One point per correct answer. Incorrect and skipped answers score zero.</p>
      {test.questions.map((q, i) => <fieldset className="card" key={i} disabled={busy}>
        <legend>{i + 1}. {q.prompt}</legend>
        {q.options.map((option, j) => <label key={j} style={{ display: 'block' }}>
          <input type="radio" name={'question-' + i} checked={answers[i] === j}
            onChange={() => setAnswers((old) => old.map((value, n) => n === i ? j : value))} /> {option}
        </label>)}
        <button type="button" className="btn" onClick={() => setAnswers((old) => old.map((value, n) => n === i ? null : value))}>Clear answer</button>
      </fieldset>)}
      <button className="btn btn-primary" disabled={busy}>Submit answers</button>
    </form> : <div className="feature-grid">
      {!busy && tests.length === 0 && <p>No mock tests are available yet.</p>}
      {tests.map((item) => <div className="card" key={item.id}><h2>{item.title}</h2>
        <p>{item.questionCount} questions</p>
        <button className="btn btn-primary" disabled={busy} onClick={() => start(item.id)}>Start test</button></div>)}
    </div>}
    <h2>Your recent results</h2>
    {attempts.length === 0 ? <p>No attempts yet.</p> : <div className="table-wrap"><table>
      <thead><tr><th>Test</th><th>Score</th><th>Percentage</th><th>Submitted</th></tr></thead>
      <tbody>{attempts.map((item) => <tr key={item._id}>
        <td>{item.testId?.title || 'Unavailable test'}</td><td>{item.score}/{item.total}</td>
        <td>{item.percentage}%</td><td>{new Date(item.createdAt).toLocaleString()}</td>
      </tr>)}</tbody></table></div>}
    <h2>Interview preparation</h2>
    <div className="feature-grid">{interview.map((item) => <article className="card" key={item.question}>
      <h3>{item.topic}</h3><p><strong>{item.question}</strong></p><p>{item.guidance}</p>
    </article>)}</div>
  </>;
}

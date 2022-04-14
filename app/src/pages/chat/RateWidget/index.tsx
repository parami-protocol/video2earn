import styles from './index.less';

export enum Rate {
  GOOD = 'Good',
  BAD = 'Bad',
}

export function RateWidget({
  showRate,
  rate,
  onRated,
}: {
  showRate: boolean;
  rate?: Rate;
  onRated: (rate: Rate) => void;
}) {
  if (!showRate) {
    return null;
  }

  if (!rate) {
    return (
      <div className={styles.rate_container}>
        <button
          className={styles.rate_button}
          style={{ borderColor: 'red' }}
          onClick={() => onRated(Rate.BAD)}
        >
          ❌
        </button>
        <button
          className={styles.rate_button}
          style={{ borderColor: 'green' }}
          onClick={() => onRated(Rate.GOOD)}
        >
          ✅
        </button>
      </div>
    );
  }

  const style = {
    borderColor: rate == Rate.GOOD ? 'green' : 'red',
  };

  return (
    <div className={styles.rate_container}>
      {' '}
      <div className={styles.rate_result} style={style}>
        <div>{rate == Rate.GOOD ? '✅' : '❌'}</div>
      </div>{' '}
    </div>
  );
}

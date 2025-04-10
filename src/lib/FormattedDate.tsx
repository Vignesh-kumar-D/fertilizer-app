'use client';

import { useEffect, useState } from 'react';

const FormattedDate = ({ date }: { date: string | Date }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (date) {
      setFormattedDate(new Date(date).toLocaleDateString());
    } else {
      setFormattedDate('');
    }
  }, [date]);

  return <span>{formattedDate}</span>;
};
export default FormattedDate;

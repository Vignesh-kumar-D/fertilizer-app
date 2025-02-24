'use client';

import { useEffect, useState } from 'react';

const FormattedDate = ({ date }: { date: string | Date }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(new Date(date).toLocaleDateString());
  }, [date]);

  return <span>{formattedDate}</span>;
};
export default FormattedDate;

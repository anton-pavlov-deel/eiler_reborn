export const zip = ({ keys, values=[], defaultValue=null }) => {
  const result = {};
  for (let  i = 0; i < keys.length; i++) {
    result[keys[i]] = (i < values.length ? values[i] : defaultValue);
  }
  return result;
};

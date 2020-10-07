/**
 * Figure out which response type to send based on accept header
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
 *
 * @param  {string}  accept       The accept header
 * @param  {array}   mimes        Our desired response types (in order as defined in the openapi file)
 *
 * @return {string | undefined}   If the accept header contains something we would like to
 *                                send, it will be returned, else undefined.
 */
export default (accept: string, mimes: string[]): string => {
  if (!accept || !mimes?.length) {
    throw new Error('Should not be hit');
  }

  const priority: string[][] = accept.split(/\s*,\s*/).reduce((acc, val) => {
    const [mime, prio] = val.split(';');
    const prioValue = (prio || '1').replace(/.*=\s*/, '');
    const index = 10 - Math.round(parseFloat(prioValue) * 10);
    acc[index] = (acc[index] || []).concat(mime);

    return acc;
  }, []);

  const parts = [...mimes, '*/*'].reduce((acc, mime) => {
    if (!mime) {
      return acc;
    }
    const [type, subtype] = mime.split('/');
    if (!subtype) {
      return acc.concat(type.replace(/\*/g, '\\*'));
    }

    return acc.concat(`${type}\/(${subtype}|*)`.replace(/\*/g, '\\*'));
  }, []);

  const willAccept = new RegExp(parts.join('|'));
  const matchingAccept = priority.find((mimeTypes) => mimeTypes.find((mime) => willAccept.test(mime)))?.[0];

  let matchRegex: string | RegExp = 'NOPE';

  if (matchingAccept) {
    matchRegex = new RegExp(matchingAccept.replace(/\*/g, '[^/]*'));
  }

  if (!matchingAccept) {
    return;
  }

  const contentType = mimes.find((mime) => (matchRegex as RegExp).test(mime));

  return contentType;
};

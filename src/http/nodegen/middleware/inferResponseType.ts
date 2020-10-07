import NodegenRequest from '@/http/interfaces/NodegenRequest';
import { NotAcceptableException } from '@/http/nodegen/errors';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';
import getPreferredResponseFormat from '@/http/nodegen/utils/getPreferredResponseFormat';
import express from 'express';
import objectReduceByMap from 'object-reduce-by-map';

export default () => {
  return (req: NodegenRequest, res: GenerateItExpressResponse, next: express.NextFunction) => {
    res.inferResponseType = (
      dataOrPath = undefined,
      status = 200,
      produces?: string,
      outputMap?: Record<string, any>
    ) => {
      // Send only a status when data is undefined
      if (dataOrPath === undefined) {
        return res.sendStatus(status);
      }

      const accept = req.headers['accept'] || '*/*';
      let possibleResponseTypes: string[] = produces ? [...produces.split(',')] : ['application/json'];

      // Calculate the responseContentType based on the provided accept header
      let responseContentType = getPreferredResponseFormat(accept, possibleResponseTypes);

      if (!responseContentType) {
        console.error(`Requested content-type "${accept}" not supported`);
        throw new NotAcceptableException(`Requested content-type "${accept}" not supported`);
      }

      // No "produces" in the openapi file
      if (responseContentType === 'application/json') {
        return res.status(status).json(objectReduceByMap(dataOrPath, outputMap));
      }

      // All images use with sendFile
      if (responseContentType.startsWith('image/') || responseContentType.startsWith('font/')) {
        return res.sendFile(dataOrPath);
      }

      // Simple pass for text/* let the consumer handle the rest
      if (responseContentType.startsWith('text/')) {
        return res.set('Content-Type', responseContentType).status(status).send(dataOrPath);
      }

      // Everything else we assume the input is a path to a file and should be downloaded
      // XML is typically sent not downloaded but fairly outdated today so the converter js2xmlparser
      // is not included
      return res.download(dataOrPath);
    };

    next();
  };
};

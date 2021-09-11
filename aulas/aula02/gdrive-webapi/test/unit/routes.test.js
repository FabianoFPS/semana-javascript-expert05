import { describe, test, expect, jest } from "@jest/globals";
import fileHelper from "../../src/fileHelper.js";

import Routes from '../../src/routes.js'
import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";

describe('#Routes suite test', () => {
  const request = TestUtil.generateReadableStream(['some file bytes'])
  const response = TestUtil.generateWritableStream(() => { })
  const defaultParams = {
    request: Object.assign(request, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      method: '',
      body: {},
    }),
    response: Object.assign(response, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    }),
    values: () => Object.values(defaultParams)
  }

  describe('#setSocketInstance', () => {
    test('setSocket should store io instance', () => {
      const routes = new Routes
      const ioObj = {
        to: id => ioObj,
        emit: (event, message) => { }
      }
      routes.setSocketInstance(ioObj)
      expect(routes.io).toStrictEqual(ioObj);
    })
  })

  describe('#handler', () => {
    test('given an inexistent route it should choose defulta route', async () => {
      const routes = new Routes
      const params = { ...defaultParams }

      params.request.method = 'inexistent'
      await routes.handler(...params.values())
      expect(params.response.end).toHaveBeenCalledWith('Hello Word!')
    })

    test('it should set any request with CORS enabled', async () => {
      const routes = new Routes
      const params = { ...defaultParams }

      params.request.method = 'inexistent'
      await routes.handler(...params.values())
      expect(params.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    })

    test('given method OPTIONS it should choose options route', async () => {
      const routes = new Routes
      const params = { ...defaultParams }

      params.request.method = 'OPTIONS'
      await routes.handler(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(204)
      expect(params.response.end).toHaveBeenCalled()
    })

    test('given method POST it should choose post route', async () => {
      const routes = new Routes
      const params = { ...defaultParams }

      params.request.method = 'POST'
      jest.spyOn(routes, routes.post.name).mockResolvedValueOnce()
      await routes.handler(...params.values())
      expect(routes.post).toHaveBeenCalled()
    })

    test('given method GET it should choose get route', async () => {
      const routes = new Routes
      const params = { ...defaultParams }

      params.request.method = 'GET'
      jest.spyOn(routes, routes.get.name).mockResolvedValueOnce()
      await routes.handler(...params.values())
      expect(routes.get).toHaveBeenCalled()
    })

  })

  describe('#get', () => {
    test('given method GET it should list all files download', async () => {
      const routes = new Routes
      const params = { ...defaultParams }
      const expectResult = [
        {
          size: '188 kB',
          lastModified: '2021-09-07T17:41:14.008Z',
          owner: 'fabiano',
          file: 'fileName'
        }
      ]

      jest
        .spyOn(routes.fileHelper, routes.fileHelper.getFilesStatus.name)
        .mockResolvedValueOnce(expectResult)

      params.request.method = 'GET'
      await routes.handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(200)
      expect(params.response.end).toHaveBeenLastCalledWith(JSON.stringify(expectResult))
    })
  })

  describe('#Ppost', () => {
    test('it should calidate post route workflow', async () => {
      const routes = new Routes
      const options = {
        ...defaultParams
      }

      options.request.method = 'POST'
      options.request.url = '?socketId=10'

      jest
        .spyOn(
          UploadHandler.prototype,
          UploadHandler.prototype.registerEvents.name
        ).mockImplementation((headers, onFinish) => {
          const writable = TestUtil.generateWritableStream(() => { })
          writable.on('finish', onFinish)

          return writable
        })

      await routes.handler(...options.values())

      expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled()
      expect(options.response.writeHead).toHaveBeenCalledWith(200)
      const expectResult = JSON.stringify({ result: 'Files uploaded with success!' })
      expect(options.response.end).toHaveBeenCalledWith(expectResult)
    })
  })
})
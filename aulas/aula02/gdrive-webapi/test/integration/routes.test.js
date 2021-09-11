import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  beforeAll,
  afterAll
} from "@jest/globals";
import fs from "fs";
import { join, resolve } from "path";
import { pipeline } from "stream/promises";
import { logger } from "../../src/logger.js";
import FormData from 'form-data'
import { tmpdir } from "os";

import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";
import Routes from "../../src/routes.js";

describe('#Routes Integration Test', () => {
  let defaultDownloadsFolder = ''

  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'downloads-'))
  })

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true })
  })

  beforeEach(() => {
    jest
      .spyOn(logger, 'info')
      .mockImplementation();
  })

  describe('#getFileStatus', () => {
    const ioObj = {
      to: id => ioObj,
      emit: (event, message) => { }
    }


    test('should upload file to the folder', async () => {
      const filename = 'image.jpeg'
      const fileStream = fs.createReadStream(
        `./test/mocks/${filename}`
      )
  
      const form = new FormData()
      form.append('photo', fileStream)
  
      const response = TestUtil.generateWritableStream(() => { })
      const defaultParams = {
        request: Object.assign(form, {
          headers: form.getHeaders(),
          method: 'POST',
          url: '?socketId=10'
        }),
        response: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
        values: () => Object.values(defaultParams)
      }
  
      const routes = new Routes(defaultDownloadsFolder)
      routes.setSocketInstance(ioObj)
      const dirBeforeRan = await fs.promises.readdir(defaultDownloadsFolder)
      expect(dirBeforeRan).toEqual([])
      await routes.handler(...defaultParams.values())
      const dirAfterRan = await fs.promises.readdir(defaultDownloadsFolder)
      expect(dirAfterRan).toEqual([filename])

      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200)
      const expectResult = JSON.stringify({ result: 'Files uploaded with success!'})
      expect(defaultParams.response.end).toHaveBeenCalledWith(expectResult)
    })
  })
})
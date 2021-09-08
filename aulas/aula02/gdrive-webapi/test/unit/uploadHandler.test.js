import { describe, test, expect, jest } from "@jest/globals";

import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";

describe('#UploadHandler test suite', () => {
  const ioObj = {
    to: id => ioObj,
    emit: (event, message) => { }
  }

  
  describe('#registerEvents', () => {
    test('should call onFile function on Busboy instance', () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        sockeId: '01',
        downloadsFolder: '/tmp'
      })

      jest
        .spyOn(uploadHandler, uploadHandler.onFile.name)
        .mockResolvedValueOnce()

      const headers = {
        'content-type': 'multipart/form-data; boundary='
      }
      const onFinish = jest.fn()
      const busboyInstance = uploadHandler.registerEvents(headers, onFinish)

      const fileStream = TestUtil.generateReadableStream(['Chunk', 'of', 'data'])
      busboyInstance.emit('file', 'filename', fileStream, 'filename.txt')
      busboyInstance.listeners('finish')[0].call()
      expect(uploadHandler.onFile).toHaveBeenCalled()
      expect(onFinish).toHaveBeenCalled();
    })
  })

  describle('#onFile', () => {
    test('given a stream file it should save it on disk', async () => {
      const chunks = ['hey', 'dude']
      const downloadsFolder = '/tmp'
      const uploadHandler = new UploadHandler({
        io: ioObj,
        sockeId: '01',
        downloadsFolder
      })
    })
  })
})
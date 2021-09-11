import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import fs from "fs";
import { resolve } from "path";
import { pipeline } from "stream/promises";
import { logger } from "../../src/logger.js";

import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";

describe('#UploadHandler test suite', () => {
  const ioObj = {
    to: id => ioObj,
    emit: (event, message) => { }
  }

  beforeEach(() => {
    jest
      .spyOn(logger, 'info')
      .mockImplementation();
  })

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

  describe('#onFile', () => {
    test('given a stream file it should save it on disk', async () => {
      const chunks = ['hey', 'dude']
      const downloadsFolder = '/tmp'
      const handler = new UploadHandler({
        io: ioObj,
        sockeId: '01',
        downloadsFolder
      })

      const onData = jest.fn()

      jest
        .spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtil.generateWritableStream(onData))



      const onTransform = jest.fn()
      jest
        .spyOn(handler, handler.handleFileBytes.name)
        .mockImplementation(() => TestUtil.generateTransformeStream(onTransform))

      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'mockFile.mov'
      }

      await handler.onFile(...Object.values(params))

      expect(onData.mock.calls.join()).toEqual(chunks.join());
      expect(onTransform.mock.calls.join()).toEqual(chunks.join());

      const expectFileName = resolve(handler.downloadsFolder, params.filename)
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectFileName)
    })
  })

  describe('#handleFileBytes', () => {
    test('should call emit function and it is a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)

      const handler = new UploadHandler({
        io: ioObj,
        sockeId: '01'
      })

      const messages = ['hello']
      const source = TestUtil.generateReadableStream(messages)
      const onWrite = jest.fn()
      const target = TestUtil.generateWritableStream(onWrite)

      jest
        .spyOn(handler, handler.canExecute.name)
        .mockReturnValue(true)

      await pipeline(
        source,
        handler.handleFileBytes("filename.txt"),
        target
      )

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)
      // se o handleFileBytes for um transofrm stream
      // vai continuar o processo, passando os dados para frente
      // e chamar nossa função no target a cada chunk
      expect(onWrite).toBeCalledTimes(messages.length)
      expect(onWrite.mock.calls.join()).toEqual(messages.join())
    })

    test(
      'givem message timerDelay as 2secs it should emit only two message during 3 seconds period'
      , async () => {
        jest.spyOn(ioObj, ioObj.emit.name)

        const twoSecondsPeriod = 2000
        const day = '2021-09-11 01:01'
        const onFirtLastMessageSent = TestUtil.getTimeFromDate(`${day}:01`)
        const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:03`)
        const onSecondUpdateLastMessageSend = onFirstCanExecute
        const onSecondVariable = TestUtil.getTimeFromDate(`${day}:04`)
        const onThirdVariable = TestUtil.getTimeFromDate(`${day}:05`)
        TestUtil.mockDateNow([
          onFirtLastMessageSent,
          onFirstCanExecute,
          onSecondUpdateLastMessageSend,
          onSecondVariable,
          onThirdVariable,
        ])

        const messages = ['hello', 'hello', 'word']
        const source = TestUtil.generateReadableStream(messages)
        const handler = new UploadHandler({
          io: ioObj,
          sockeId: '01',
          messageTimeDelay: twoSecondsPeriod
        })
        const filename = 'filename.avi'

        await pipeline(
          source,
          handler.handleFileBytes(filename)
        )

        const expectedMessagesSent = 2
        expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessagesSent)

        const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls

        expect(firstCallResult).toEqual([
          handler.ON_UPLOAD_EVENT,
          { processedAlready: messages[0].length, filename }
        ])

        expect(secondCallResult).toEqual([
          handler.ON_UPLOAD_EVENT,
          { processedAlready: messages.join('').length, filename }
        ])
      })
  })

  describe('#canExecute', () => {

    test('should return true when time is later than specifield delay', () => {
      const timerDelay = 1000
      const uploadhandler = new UploadHandler({
        io: {},
        sockeId: '01',
        downloadsFolder: '/tmp'
      })

      const tickNow = TestUtil.getTimeFromDate('2021-09-11 00:00:03')
      TestUtil.mockDateNow([tickNow])
      const tickThreeSecondsBefore = TestUtil.getTimeFromDate('2021-09-11 00:00:00')
      const lastExecution = tickThreeSecondsBefore

      const result = uploadhandler.canExecute(lastExecution)
      expect(result).toBeTruthy();
    })

    test('should return false when time isnt later than specified delay', () => {
      const timerDelay = 3000
      const uploadhandler = new UploadHandler({
        io: {},
        sockeId: '01',
        downloadsFolder: '/tmp',
        messageTimeDelay: timerDelay
      })

      const now = TestUtil.getTimeFromDate('2021-09-11 00:00:02')
      TestUtil.mockDateNow([now])
      const lastExecution = TestUtil.getTimeFromDate('2021-09-11 00:00:0')

      const result = uploadhandler.canExecute(lastExecution)
      expect(result).toBeFalsy();
    })
  })
})
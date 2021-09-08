import { describe, test, expect, jest } from "@jest/globals";
import fs from 'fs'

import FileHelper from "../../src/fileHelper.js";
import Routes from '../../src/routes.js'

describe('#FileHelper', () => {
  describe('#getFileStatus', () => {
    test('it should return status in correct format', async () => {
      const statMock = {
        dev: 2050,
        mode: 33204,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 4741794,
        size: 188188,
        blocks: 0,
        atimeMs: 1631036474083.6348,
        mtimeMs: 1631036474007.6309,
        ctimeMs: 1631036474007.6309,
        birthtimeMs: 1631036474007.6309,
        atime: '2021-09-07T17:41:14.084Z',
        mtime: '2021-09-07T17:41:14.008Z',
        ctime: '2021-09-07T17:41:14.008Z',
        birthtime: '2021-09-07T17:41:14.008Z'
      }

      const mockUser = 'fabiano'
      process.env.USER = mockUser
      const fileName = 'file.type'
      
      jest
        .spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValueOnce([fileName])

      jest
        .spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValueOnce(statMock)

      const result = await FileHelper.getFilesStatus('/tmp');

      const expectResult = [
        {
          size: '188 kB',
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: fileName
        }
      ]

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${fileName}`)
      expect(result).toMatchObject(expectResult)
    })
  })
})
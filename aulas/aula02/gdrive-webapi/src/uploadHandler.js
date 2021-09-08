import Busboy from "busboy";

export default class UploadHandler {
  constructor({ io, sockeId, downloadsFolder }) { 
    this.io = io
    this.sockeId = sockeId
    this.downloadsFolder = downloadsFolder
  }
  
  onFile(fildname, file, filename) { }
  
  registerEvents(headers, onFinish) {
    const busboy = new Busboy({ headers })
    busboy.on('file', this.onFile.bind(this))
    busboy.on('finish', onFinish)
    return busboy
  }
}
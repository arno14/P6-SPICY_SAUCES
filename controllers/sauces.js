const Thing = require("../models/thing");
const fs = require('fs');

exports.createThing = (req, res, next) => {
  const thingObject = JSON.parse(req.body.thing);
  delete thingObject._id;
  const thing = new Thing({
    ...thingObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  thing.save()
    .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneThing = (req, res, next) => {
  Thing.findOne({
    _id: req.params.id,
  })
    .then((thing) => {
      res.status(200).json(thing);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifyThing = (req, res, next) => {
  const thingObject = req.file ?
    {
      ...JSON.parse(req.body.thing),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  Thing.updateOne({ _id: req.params.id }, { ...thingObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet modifié !'}))
    .catch(error => res.status(400).json({ error }));
};


exports.deleteThing = (req, res, next) => {
  Thing.findOne({ _id: req.params.id })
    .then(thing => {
      const filename = thing.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Thing.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getAllThing = (req, res, next) => {
  Thing.find()
    .then((things) => {
      res.status(200).json(things);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.likeThing = (req, res, next) => {
  const like = req.body.like;
  const idSauce = req.params.id;
  
  Thing.findOne({ _id: idSauce })
  .then (thing => {
      const idIncluded = !thing.usersLiked.includes(req.body.userId) && !thing.usersDisliked.includes(req.body.userId);
      if( like === 1 && idIncluded ) {
          Thing.updateOne({ _id:idSauce },{
              $push: { usersLiked: req.body.userId },
              $inc: { likes: +1 }
          })
          .then(() => res.status(200).json({ message: 'like ajouté !'}))
          .catch(error => res.status(400).json({ error }));
      }else if( like === -1 && idIncluded ) {
          Thing.updateOne({ _id:idSauce }, {
              $push: { usersDisliked: req.body.userId },
              $inc: { dislikes: +1 }
          })
          .then(() => res.status(200).json({ message: 'dislike ajoutée !'}))
          .catch(error => res.status(400).json({ error }));
      }else {
          if(thing.usersLiked.includes(req.body.userId)){
              Thing.updateOne({ _id:idSauce },{
                  $pull: { usersLiked: req.body.userId },
                  $inc: { likes: -1 }
              }) 
              .then(() => res.status(200).json({ message: 'like retiré !'}))
              .catch(error => res.status(400).json({ error })); 
          }else if(thing.usersDisliked.includes(req.body.userId)){
              Thing.updateOne({ _id:idSauce }, {
                  $pull: { usersDisliked: req.body.userId },
                  $inc: { dislikes: -1 } 
              })
              .then(() => res.status(200).json({ message: 'dislike retiré !'}))
              .catch(error => res.status(400).json({ error }));
          }
      }
  })
};
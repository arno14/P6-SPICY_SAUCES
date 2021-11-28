const Sauce = require("../models/sauce");
const fs = require("fs");

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `/images/${req.file.filename}`, //sans doute préférable d'enregistrer un chemin relatif de l'image, car si on change de nom de domaine, il faut renommer toutes les images dans la Base de données
  });
  sauce
    .save()
    .then(() => res.status(201).json({ message: "Objet enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `/images/${req.file.filename}`,
    }
    : { ...req.body };
  Sauce.updateOne(
    { _id: req.params.id },
    { ...sauceObject, _id: req.params.id }
  )
    .then(() => res.status(200).json({ message: "Objet modifié !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Objet supprimé !" }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.likeSauce = (req, res, next) => {
  const like = req.body.like; //prend les valeurs -1, 0 ou 1
  const idSauce = req.params.id;
  const userId = req.body.userId;

  Sauce.findOne({ _id: idSauce }).then((sauce) => {

    // tentatives de refactoring
    // c'est pas encore vraiment fonctionnel

    const userHasAlreadyLiked=sauce.usersLiked.includes(userId);
    const userHasAlreadyDisliked=sauce.usersDisliked.includes(userId);

    //on affiche toutes les infos utiles pour débuguer dans le console du server
    console.log({ sauce , userId, userHasAlreadyLiked, userHasAlreadyDisliked });

    if(userHasAlreadyLiked && like===1){
      res.status(200).json({"message": "Already liked!"});
      return;//important, on arrete le traitement ici, le code ci-dessous ne sera pas exécuté
    }

    if(userHasAlreadyDisliked && like===1){
      res.status(200).json({"message": "Already liked!"});
      return;
    }

    let updateDatas = null;//contiendra les données à envoyer à Mongo DB
    let message = "An error occured";

    //dislike 
    if(like===-1){
      updateDatas={
          $pull:{usersLiked: userId},//je pense que l'on peut toujours mettre l'instruction de supprimer le like, même si le user Id n'étais pas présent dans la liste
          $push:{usersDisliked: userId},
          $inc: { dislikes: +1 },
        }
        message = "dislike ajoutée !";
        if(userHasAlreadyLiked){
          updateDatas['$inc']['likes']=-1;
          message+=" like supprimés"; //ça peut aider d'avoir des messages différenciés, pour mieux voir ce qu'il se passe
        }
        
    //neutral
    }else if(like===0){
        updateDatas={
          $pull:{usersLiked: userId},
          $pull:{usersDisliked: userId},
          $inc: {},
        }
        message="Neutral";
        if(userHasAlreadyDisliked){
          updateDatas['$inc']['dislikes']=-1;
          message+" dislike supprimé!";
        }
        if(userHasAlreadyLiked){
          updateDatas['$inc']['likes']=-1;
          message+" like supprimé!";
        }

    //like 
    }else if(like===1){
        updateDatas={
          $push:{usersLiked: userId},
          $pull:{usersDisliked: userId},
          $inc: { likes: +1 },
        }
        message = "like ajoutée !";
        if(userHasAlreadyDisliked){
          updateDatas['$inc']['dislikes']=-1;
          message+=" dislike supprimés!"
        }

    }else{
      res.status(400).json({message:`valeur ${like} invalide!!!`});
      return;
    }

    console.log({updateDatas, message});

    Sauce.updateOne({ _id: idSauce }, updateDatas)
      .then(() => res.status(200).json({ message }))
      .catch((error) => res.status(400).json({ error }));
  });
};

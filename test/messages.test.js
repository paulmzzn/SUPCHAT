// test/messages.test.js
import chai from 'chai';
import chaiHttp from 'chai-http';
import server from '../server.js';

const should = chai.should();
chai.use(chaiHttp);

describe('Messages', () => {
  // Test pour récupérer tous les messages
  it('should GET all the messages', (done) => {
    chai.request(server)
      .get('/api/messages')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  });

  // Test pour récupérer un message par ID
  it('should GET a message by the given id', (done) => {
    const messageId = 'uuid_existant';
    chai.request(server)
      .get(`/api/messages/${messageId}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id_message').eql(messageId);
        done();
      });
  });

  // Test pour créer un nouveau message
  it('should POST a new message', (done) => {
    const message = {
      contenu: 'Test message',
      fk_channel: 'uuid_du_channel',
      fk_user: 'uuid_de_l_utilisateur'
    };
    chai.request(server)
      .post('/api/messages')
      .send(message)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('contenu').eql('Test message');
        done();
      });
  });

  // Test pour mettre à jour un message
  it('should UPDATE a message', (done) => {
    const messageId = 'uuid_existant';
    const updatedMessage = {
      contenu: 'Updated message'
    };
    chai.request(server)
      .put(`/api/messages/${messageId}`)
      .send(updatedMessage)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('contenu').eql('Updated message');
        done();
      });
  });

  // Test pour supprimer un message
  it('should DELETE a message', (done) => {
    const messageId = 'uuid_existant';
    chai.request(server)
      .delete(`/api/messages/${messageId}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('message').eql('Message supprimé avec succès');
        done();
      });
  });
});
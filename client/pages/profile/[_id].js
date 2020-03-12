import { useState, useEffect } from "react";
import axios from "axios";

import { API } from "../../config";
import formatDate from "../../utils/formatDate";
import Layout from "../../components/Layout";
import LinkComponent from "../../components/LinkComponent";

const ProfilePage = ({ user, statusCode, links }) => {
  console.log(user);
  console.log(links);

  const { role, username, createdAt } = user;

  const handleClickCount = async _id => {
    await axios.put(`${API}/click-count`, { _id });
  };

  if (statusCode === 404) {
    return (
      <Layout>
        <div className="container pt-5 text-center">
          <h1>Oops!</h1>
          <p>There is no user with that name</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <h1 className="title">Profile</h1>
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col text-center">
                <h3>{username}</h3>
                <p className="text-muted">Role: {role}</p>
                <p className="text-muted">Joined on: {formatDate(createdAt)}</p>
                <p className="text-muted">Total Post: {links.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <br />

      <div className="container">
        <div className="title">Recent posts</div>
        {links &&
          links.map(link => (
            <div className="row alert alert-info mb-0 mt-2" key={link._id}>
              <LinkComponent link={link} handleClickCount={handleClickCount} />
            </div>
          ))}
      </div>
    </Layout>
  );
};

ProfilePage.getInitialProps = async ({ query }) => {
  const { data } = await axios.get(`${API}/profile/${query._id}`);
  if (!data) {
    return { statusCode: 404 };
  }
  console.log(data);
  return { user: data.user, links: data.links };
};

export default ProfilePage;

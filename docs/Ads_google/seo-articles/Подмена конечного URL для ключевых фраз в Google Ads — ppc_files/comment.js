/**
 * This file is part of the FOSCommentBundle package.
 *
 * (c) FriendsOfSymfony <http://friendsofsymfony.github.com/>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

/**
 * To use this reference javascript, you must also have jQuery installed. If
 * you want to embed comments cross-domain, then easyXDM CORS is also required.
 *
 * @todo: expand this explanation (also in the docs)
 *
 * Then a comment thread can be embedded on any page:
 *
 * <div id="fos_comment_thread">#comments</div>
 * <script type="text/javascript">
 *     // Set the thread_id if you want comments to be loaded via ajax (url to thread comments api)
 *     var fos_comment_thread_id = 'a_unique_identifier_for_the_thread';
 *     var fos_comment_thread_api_base_url = 'http://example.org/api/threads';
 *
 *     // Optionally set the cors url if you want cross-domain AJAX (also needs easyXDM)
 *     var fos_comment_remote_cors_url = 'http://example.org/cors/index.html';
 *
 *     // Optionally set a custom callback function to update the comment count elements
 *     var fos_comment_thread_comment_count_callback = function(elem, threadObject){}
 *
 *     // Optionally set a different element than div#fos_comment_thread as container
 *     var fos_comment_thread_container = $('#other_element');
 *
 * (function() {
 *     var fos_comment_script = document.createElement('script');
 *     fos_comment_script.async = true;
 *     fos_comment_script.src = 'http://example.org/path/to/this/file.js';
 *     fos_comment_script.type = 'text/javascript';
 *
 *     (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(fos_comment_script);
 * })();
 * </script>
 */

+function (window, $) {
    "use strict";
    var ELAMA_COMMENT = {
        /**
         * Shorcut post method.
         *
         * @param string url The url of the page to post.
         * @param object data The data to be posted.
         * @param function success Optional callback function to use in case of succes.
         * @param function error Optional callback function to use in case of error.
         */
        post: function (url, data, success, error, complete) {
            // Wrap the error callback to match return data between jQuery and easyXDM
            var wrappedErrorCallback = function (response) {
                if ('undefined' !== typeof error) {
                    error(response.responseText, response.status);
                }
            };
            var wrappedCompleteCallback = function (response) {
                if ('undefined' !== typeof complete) {
                    complete(response.responseText, response.status);
                }
            };
            $.post(url, data, success).fail(wrappedErrorCallback).always(wrappedCompleteCallback);
        },

        /**
         * Shorcut get method.
         *
         * @param string url The url of the page to get.
         * @param object data The query data.
         * @param function success Optional callback function to use in case of succes.
         * @param function error Optional callback function to use in case of error.
         */
        get: function (url, data, success, error) {
            // Wrap the error callback to match return data between jQuery and easyXDM
            var wrappedErrorCallback = function (response) {
                if ('undefined' !== typeof error) {
                    error(response.responseText, response.status);
                }
            };
            $.get(url, data, success).fail(wrappedErrorCallback);
        },

        /**
         * Gets the comments of a thread and places them in the thread holder.
         *
         * @param string identifier Unique identifier url for the thread comments.
         */
        getComments: function (identifier) {
            var event = jQuery.Event('elama_comment_before_load');

            event.identifier = identifier;

            ELAMA_COMMENT.comments_container.trigger(event);
            ELAMA_COMMENT.get(
                ELAMA_COMMENT.base_url,
                '',
                // success
                function (data) {
                    ELAMA_COMMENT.comments_container.html(data);
                }
            );
        },

        /**
         * Initialize the event listeners.
         */
        initializeListeners: function () {
            ELAMA_COMMENT.comments_container.on('submit',
                '.comment-form',
                function (e) {
                    var that = $(this);
                    var serializedData = ELAMA_COMMENT.serializeObject(this);

                    that.find('.btn').addClass('btn_disabled');
                    if (document.querySelector('.js-no-comments')) {
                        $('.js-no-comments').remove();
                        $('.js-comments__title').append(`     Комментарии
                        <small class="comments__quantity" id="comments_count">0</small>`)
                    }

                    e.preventDefault();

                    var event = $.Event('elama_comment_submitting_form');
                    that.trigger(event);

                    if (event.isDefaultPrevented()) {
                        return;
                    }

                    ELAMA_COMMENT.post(
                        this.action,
                        serializedData,
                        // success
                        function (data) {
                            if (data) {
                                that.find('.btn').removeClass('btn_disabled');
                                if (data.id) {
                                    const text = data.body.replace(/\r/g, '').replace(/\n/g, '<br>')
                                    that.prev('.comment__info').after('<p class="comment__message">' + text + '</p>')
                                    $('#edit-form').appendTo($('.comment-reply_edit'));
                                    $('#edit-form').find('textarea').val('');
                                    $('.comment__edit').removeAttr('disabled').removeClass('btn_hide');
                                    $('.comment_reply').removeClass('btn_hide');


                                } else {

                                    ELAMA_COMMENT.appendComment(data, that);

                                }
                            } else {
                                var parent = that.parent();
                                parent.after('<div class="comment-add-moderation">Ваш комментарий появится после прохождения модерации</div>');
                                parent.remove();
                                that.find('.btn').removeClass('btn_disabled');
                            }
                        },
                        // error
                        function (data, statusCode) {
                            var parent = that.parent();
                            parent.after('<div class="comment-add-error">Ошибка. Попробуйте позже</div>');
                            parent.remove();
                        },
                        // complete
                        function (data, statusCode) {
                            // Удаляем блок с формой после успешной пубикации
                            var $commentsForm = $('.comments_list').find('.comments__reply');
                            if($commentsForm.length) {
                                $commentsForm.remove();
                            }
                        }
                    );
                }
            );

            ELAMA_COMMENT.comments_container.on('click',
                '.comment_reply',
                function (e) {
                    e.preventDefault();

                    const ANIMATE_TIME = 300;

                    if ($('#comment-form').length == 0) {
                        var position = undefined;

                        // подкручиваю окно к авторизации
                        if (document.querySelector('.comments__auth')) {
                            position = $('.comments__auth').offset().top - $(".header-n").height() - 40;
                        } else {
                            position = $('.comments__box').offset().top - $(".header-n").height() - 40;
                        }

                        $('html, body').animate({scrollTop: position}, ANIMATE_TIME);

                    } else {
                        var $elem = $(this);

                        var $secondForm = $('.comment-form-container.comment-reply.comments__reply:first');
                        // Клонируем форму для вставки под блок текущего ответа
                        var $clonedForm = $secondForm.clone().css('margin-top',40);
                        var $commentsList = $('.comments_list');

                        // Проверка на дублирование формы
                        var $commentsForm = $commentsList.find('.comments__reply');
                        if($commentsForm.length) {
                            $commentsForm.remove();
                        }

                        var parentId = $elem.closest('li').attr('data-id');
                        var $comment = $elem.closest('li').children('.comment');

                        $comment.after($clonedForm);

                        var parentAuthorName = $elem.attr('data-comment-author');
                        var $form = $('#comment-form');
                        var $commentBody = $clonedForm.find('#comment_body');

                        $clonedForm.find('#comment_parentId').val(parentId);

                        // добавляю обращение к автору в поле с комментарием
                        $commentBody.val(parentAuthorName + ',  ');
                        $commentBody.focus();
                    }
                }
            );

            ELAMA_COMMENT.comments_container.on('click',
                '.comment__edit',
                function (e) {
                    var $elem = $(this);
                    var $form = $('#edit-form');
                    var parentId = $elem.parents('li').attr('data-id');
                    var parentAuthorName = $elem.attr('data-comment-author');
                    var $comment = $('#edit_comment_body');
                    var $message =  $elem.siblings('.comment__message').text().trim();
                    $('.comment__edit').prop('disabled', 'true');
                    $elem.addClass('btn_hide');
                    $elem.siblings('.comment__message').replaceWith($form);
                    $elem.siblings('.comment_reply').addClass('btn_hide');
                    $comment.val($message)
                    $form.find('#edit_comment_id').val(parentId);
                    $comment.focus();

                }
            );

            ELAMA_COMMENT.comments_container.on('click',
                '#reply',
                function (e) {
                    var $form = $('#comment-form');
                    $form.find('#comment_parentId').val(0);
                    $('#reply').html('').hide();
                    return false;
                }
            );

            ELAMA_COMMENT.comments_container.on('click',
                '.fos_comment_comment_vote',
                function (e) {
                    var that = $(this);
                    var form_data = that.data();

                    // Get the form
                    ELAMA_COMMENT.get(
                        form_data.url,
                        {},
                        function (data) {
                            // Post it
                            var form = $($.trim(data)).children('form')[0];
                            var form_data = $(form).data();

                            ELAMA_COMMENT.post(
                                form.action,
                                ELAMA_COMMENT.serializeObject(form),
                                function (data) {
                                    $('#' + form_data.scoreHolder).html(data);
                                    that.trigger('fos_comment_vote_comment', data, form);
                                }
                            );
                        }
                    );
                }
            );
        },

        appendComment: function (commentHtml, form) {

            var parentId = $(form).find('input#comment_parentId').val();
            $('.new-el').remove()
            const newEl = '<span class="new-el"></span>'

            // "reset" the form
            $(form).find('input#comment_parentId').val(0);
            $(form).find('textarea').val('');
            $('#reply').html('').hide();

            // Если на комментарий ответили
            if (parentId) {
                var listContainer = $('ul.comments_list[data-parent="' + parentId + '"]');

                // Если отвечают на комметарий более одного раза, не добавлять вложенный комментарий
                if (listContainer.length) {
                    $('ul.comments_list[data-parent="' + parentId + '"]').append(commentHtml, newEl);
                // Если отвечают на комментарий первый раз, добавить вложенный комментарий
                } else {
                    $('li[data-id="' + parentId + '"]').append('<ul class="child_comments_list comments__child-list" data-parent="' + parentId + '">' + commentHtml + newEl + '</ul>');
                }
            // Добавить комментарий
            } else {
                $('ul.comments_list[data-parent="0"]').append(commentHtml, newEl);

            }


            $('body, html').animate({ scrollTop: $('.new-el').offset().top - $(".header-n").height() - 140 }, 600);

            ELAMA_COMMENT.updateCounter()
        },

        updateCounter: function () {
          $('#comments_count').html(parseInt($('#comments_count').html()) + 1);
          $('#js-comments-count-top').html(parseInt($('#js-comments-count-top').html()) + 1);

          var commentCount = document.querySelector('#js-comments-count-float')

          if(!commentCount) return false;

          commentCount = parseInt(commentCount.firstElementChild.getAttribute('data-count'));

          if (isNaN(commentCount)) {
            commentCount = 0;
          }

          document.querySelector('#js-comments-count-float').firstElementChild.setAttribute('data-count', commentCount+1);
        },

        /**
         * easyXdm doesn't seem to pick up 'normal' serialized forms yet in the
         * data property, so use this for now.
         * http://stackoverflow.com/questions/1184624/serialize-form-to-json-with-jquery#1186309
         */
        serializeObject: function (obj) {
            var o = {};
            var a = $(obj).serializeArray();
            $.each(a, function () {
                if (o[this.name] !== undefined) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
            return o;
        }
    };

    // Check if a thread container was configured. If not, use default.
    ELAMA_COMMENT.comments_container = window.elama_comment_container || $('#comments');

    // set the appropriate base url
    ELAMA_COMMENT.base_url = window.elama_comment_base_url;

    if (typeof ELAMA_COMMENT.comments_container.attr('data-id') != "undefined") {
        // get the thread comments and init listeners
        ELAMA_COMMENT.getComments(ELAMA_COMMENT.comments_container.attr('data-id'));
    }

    if (typeof window.fos_comment_thread_comment_count_callback != "undefined") {
        ELAMA_COMMENT.setCommentCount = window.fos_comment_thread_comment_count_callback;
    }

    if ($('span.fos-comment-count').length > 0) {
        ELAMA_COMMENT.loadCommentCounts();
    }

    ELAMA_COMMENT.initializeListeners();

    window.fos = window.fos || {};
    window.fos.Comment = ELAMA_COMMENT;
}(window, window.jQuery);
